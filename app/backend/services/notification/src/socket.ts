import { Server } from "socket.io";
import { FastifyInstance } from "fastify";

export let io: Server;

export function setupSocketServer(app: FastifyInstance) {
  io = new Server(app.server, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    console.log("🔔 Notification Service: User connected:", userId);

    socket.join(`user:${userId}`);

    socket.on("disconnect", () => {
      console.log("❌ User disconnected from notifications:", userId);
    });
  });
}
