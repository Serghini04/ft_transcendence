import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { io as ClientIO } from "socket.io-client";

export function setupSocketGateway(app: FastifyInstance) {
  const io = new Server(app.server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    app.log.info(`🔌 User connected via Gateway: ${userId}`);

    const chatSocket = ClientIO("http://localhost:3000", {
      withCredentials: true,
      auth: { userId },
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
