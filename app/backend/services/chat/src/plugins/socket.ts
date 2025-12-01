import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { ChatRepository } from "../repositories/chat.repository";

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

  io.on("connection", (socket) => {
    fastify.log.info(`New connection attempt from ${socket.handshake.address}`);
    const userId = socket.handshake.auth.userId;
    
    if (!userId || isNaN(Number(userId))) {
      fastify.log.warn("Connection attempt without valid userId, disconnecting");
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
    io.emit("users:online", onlineUserIds);

    socket.on("message:send", async (data) => {
      const { to, message, timestamp } = data;
      
      if (!to || !message) {
        fastify.log.warn(`Invalid message data from ${userIdNum}`);
        return;
      }
      
      if (typeof message !== 'string' || message.trim().length === 0)
        return;
      
      if (message.length > 1000) {
        socket.emit("message:error", { 
          messageId: data.id, 
          error: "Message too long (max 1000 characters)" 
        });
        return;
      }

      const receiverUserId = Number(to);
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
        const saveResult = await chatRep.sendMessage(userIdNum, receiverUserId, message, messageTimestamp);
        
        if (!saveResult.success)
          throw new Error("Failed to save message to database");

        const finalMessageData = {
          ...messageData,
          id: saveResult.messageId,
        };

        if (isUserOnline(receiverUserId))
          io.to(`user_${receiverUserId}`).emit("message:receive", finalMessageData);

        io.to(`user_${userIdNum}`).emit("message:sent", {
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
        io.emit("users:online", onlineUserIds);
      }
    });
  });
});

export default socketPlugin;
