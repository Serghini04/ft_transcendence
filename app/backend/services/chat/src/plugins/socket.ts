import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { ChatRepository } from "../repositories/chat.repository";
import { kafkaProducerService } from "../kafka/producer";

const userSockets = new Map<number, Set<string>>();
const socketUsers = new Map<string, number>();

export function getUserSockets(userId: number): string[] {
  return Array.from(userSockets.get(userId) || []);
}

export function isUserOnline(userId: number): boolean {
  const sockets = userSockets.get(userId);
  return sockets ? sockets.size > 0 : false;
}

const socketPlugin = fp(async (fastify: FastifyInstance) => {
    const io = new Server(fastify.server, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  fastify.decorate("io", io);

  fastify.log.info("Socket.IO server is ready for connections");

  const chatNS = io.of("/chat");

  chatNS.on("connection", (socket) => {
    fastify.log.info(`New connection attempt from ${socket.handshake.address}`);
    const userId = socket.handshake.auth.userId;
    
    if (!userId || isNaN(Number(userId))) {
      socket.disconnect();
      return;
    }

    const userIdNum = Number(userId);
    
    if (!userSockets.has(userIdNum))
      userSockets.set(userIdNum, new Set());
    userSockets.get(userIdNum)!.add(socket.id);
    
    socketUsers.set(socket.id, userIdNum);

    socket.join(`user_${userIdNum}`);
    
    const onlineUserIds = Array.from(userSockets.keys());
    chatNS.emit("users:online", onlineUserIds);

    socket.on("message:send", async (data) => {
      const { to, message, timestamp } = data;
      
      if (!to || !message) {
        fastify.log.warn(`Invalid message data from ${userIdNum}`);
        socket.emit("message:error", { 
          messageId: data.id, 
          error: "Invalid message data" 
        });
        return;
      }
      
      if (typeof message !== 'string' || message.trim().length === 0) {
        socket.emit("message:error", { 
          messageId: data.id, 
          error: "Message cannot be empty" 
        });
        return;
      }
      
      if (message.length > 1000) {
        socket.emit("message:error", { 
          messageId: data.id, 
          error: "Message too long (max 1000 characters)" 
        });
        return;
      }

      const receiverUserId = Number(to);
      
      if (isNaN(receiverUserId)) {
        socket.emit("message:error", { 
          messageId: data.id, 
          error: "Invalid receiver ID" 
        });
        return;
      }

      const messageTimestamp = timestamp || new Date().toISOString();
      const messageId = Date.now() + Math.random();
      
      const messageData = {
        id: messageId,
        from: userIdNum,
        to: receiverUserId,
        message,
        timestamp: messageTimestamp,
      };

      try {
        const chatRep = new ChatRepository(fastify.db);
        
        const validation = chatRep.validateUserRelationship(userIdNum, receiverUserId);
        
        if (!validation.canMessage) {
          fastify.log.warn(
            `Message blocked: ${validation.reason} ` +
            `(from ${validation.senderName || `user ${userIdNum}`} ` +
            `to ${validation.receiverName || `user ${receiverUserId}`})`
          );
          socket.emit("message:error", { 
            messageId, 
            error: validation.reason || "Cannot send message" 
          });
          return;
        }
        
        const saveResult = await chatRep.sendMessage(userIdNum, receiverUserId, message, messageTimestamp);
        
        if (!saveResult.success)
          throw new Error("Failed to save message to database");

        const finalMessageData = {
          ...messageData,
          id: saveResult.messageId,
        };
        
        // Publish notification event to Kafka
        try {
          await kafkaProducerService.publishNewMessageNotification(
            receiverUserId,
            validation.senderName ?? "Unknown User",
            messageData.message,
            new Date(messageData.timestamp)
          );
          fastify.log.info(`Kafka notification sent for message to user ${receiverUserId}`);
        } catch (kafkaError) {
          fastify.log.error(`Failed to publish Kafka notification: ${kafkaError}`);
          // Don't fail the message send if Kafka fails
        }

        if (isUserOnline(receiverUserId))
          chatNS.to(`user_${receiverUserId}`).emit("message:receive", finalMessageData);

        chatNS.to(`user_${userIdNum}`).emit("message:sent", {
          ...finalMessageData,
          isSender: true
        });

      } catch (error) {
        socket.emit("message:error", { 
          messageId, 
          error: "Failed to send message" 
        });
      }
    });

    socket.on("chat:join", (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on("chat:leave", (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    socket.on("disconnect", () => {
      const userIdNum = socketUsers.get(socket.id);
      
      if (userIdNum) {
        const userSocketSet = userSockets.get(userIdNum);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0)
            userSockets.delete(userIdNum);
        }
        
        socketUsers.delete(socket.id);
        
        const onlineUserIds = Array.from(userSockets.keys());
        chatNS.emit("users:online", onlineUserIds);
      }
    });
  });
});

export default socketPlugin;
