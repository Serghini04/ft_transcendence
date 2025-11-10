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
      origin: [
        "http://localhost:5173"
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  fastify.decorate("io", io);

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    
    if (!userId || isNaN(Number(userId))) {
      fastify.log.warn("⚠️ Connection attempt without valid userId");
      socket.disconnect();
      return;
    }

    const userIdNum = Number(userId);
    
    if (!userSockets.has(userIdNum))
      userSockets.set(userIdNum, new Set());
    userSockets.get(userIdNum)!.add(socket.id);
    
    socketUsers.set(socket.id, userIdNum);
    
    // join user-specific room for multi-tab sync
    socket.join(`user_${userIdNum}`);
    
    fastify.log.info(`✅ User ${userIdNum} connected: ${socket.id} (${userSockets.get(userIdNum)?.size} active tabs)`);
    
    // broadcast online users to all clients
    const onlineUserIds = Array.from(userSockets.keys()).filter(id => isUserOnline(id));
    io.emit("users:online", onlineUserIds);

    // handle incoming messages
    socket.on("message:send", async (data) => {
      const { to, message, timestamp } = data;
      
      if (!to || !message) {
        fastify.log.warn(`⚠️ Invalid message data from ${userIdNum}`);
        return;
      }

      const receiverUserId = Number(to);
      const messageTimestamp = timestamp || new Date().toISOString();
      const messageId = Date.now() + Math.random();
      
      fastify.log.info(`📨 Message from ${userIdNum} to ${receiverUserId}: ${message.substring(0, 50)}...`);
      
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

        if (isUserOnline(receiverUserId)) {
          io.to(`user_${receiverUserId}`).emit("message:receive", finalMessageData);
          fastify.log.info(`✅ Message delivered to user ${receiverUserId} (${getUserSockets(receiverUserId).length} tabs)`);
        } else {
          fastify.log.info(`📱 User ${receiverUserId} offline, message saved for later`);
        }

        io.to(`user_${userIdNum}`).emit("message:sent", {
          ...finalMessageData,
          isSender: true
        });

      } catch (error) {
        fastify.log.error(`❌ Error handling message: ${error}`);
        socket.emit("message:error", { 
          messageId, 
          error: "Failed to send message" 
        });
      }
    });

    socket.on("chat:join", (chatId) => {
      socket.join(`chat_${chatId}`);
      fastify.log.info(`👥 User ${userIdNum} joined chat ${chatId}`);
    });

    socket.on("chat:leave", (chatId) => {
      socket.leave(`chat_${chatId}`);
      fastify.log.info(`👋 User ${userIdNum} left chat ${chatId}`);
    });

    socket.on("typing:start", (data) => {
      const { chatId, receiverUserId } = data;
      if (isUserOnline(receiverUserId)) {
        io.to(`user_${receiverUserId}`).emit("typing:start", {
          userId: userIdNum,
          chatId
        });
      }
    });

    socket.on("typing:stop", (data) => {
      const { chatId, receiverUserId } = data;
      if (isUserOnline(receiverUserId)) {
        io.to(`user_${receiverUserId}`).emit("typing:stop", {
          userId: userIdNum,
          chatId
        });
      }
    });

    socket.on("disconnect", () => {
      const userIdNum = socketUsers.get(socket.id);
      
      if (userIdNum) {
        const userSocketSet = userSockets.get(userIdNum);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            userSockets.delete(userIdNum);
            fastify.log.info(`❌ User ${userIdNum} fully disconnected`);
          } else {
            fastify.log.info(`📱 User ${userIdNum} tab disconnected: ${socket.id} (${userSocketSet.size} tabs remaining)`);
          }
        }
        
        socketUsers.delete(socket.id);
        
        // broadcast updated online users
        const onlineUserIds = Array.from(userSockets.keys()).filter(id => isUserOnline(id));
        io.emit("users:online", onlineUserIds);
      }
    });
  });
});

export default socketPlugin;
