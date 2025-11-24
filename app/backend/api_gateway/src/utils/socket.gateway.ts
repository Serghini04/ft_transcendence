import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { io as ClientIO } from "socket.io-client";

export function setupSocketGateway(app: FastifyInstance) {
  // Attach Socket.IO to the raw server
  const io = new Server(app.server, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ["websocket"], // force websocket, disable polling
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    app.log.info(`🔌 User connected via Gateway: ${userId}`);

    const chatSocket = ClientIO("http://localhost:3003", {
      withCredentials: true,
      auth: { userId },
      transports: ["websocket"], // force WebSocket
    });

    socket.onAny((event, data) => chatSocket.emit(event, data));
    chatSocket.onAny((event, data) => socket.emit(event, data));

    socket.on("disconnect", () => {
      app.log.info(`❌ User ${userId} disconnected`);
      chatSocket.disconnect();
    });
  });

  app.log.info("✅ Socket.IO Gateway initialized");
}
