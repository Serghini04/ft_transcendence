// gameGateway.ts
import { Server, Socket } from "socket.io";
import { FastifyInstance } from "fastify";
import { createRoom, updateGame, rooms } from "./game.controller";

export const gameGateway = (fastify: FastifyInstance) => {
  const io = new Server(fastify.server, {
    cors: { origin: "*" },
  });

  const waitingPlayers = new Map<string, Socket>();

  io.on("connection", (socket) => {
    console.log(`🟢 ${socket.id} connected`);

    socket.on(
      "joinGame",
      async ({
        userId,
        options = { map: "Classic", powerUps: false, speed: "Normal" },
      }) => {
        socket.data.userId = userId || socket.id;

        const configKey = JSON.stringify(options);
        const waiting = waitingPlayers.get(configKey);

        if (!waiting) {
          waitingPlayers.set(configKey, socket);
          socket.emit("waiting");
        } else {
          waitingPlayers.delete(configKey);
          await createRoom(waiting, socket, configKey, options);
        }
      }
    );

    socket.on("move", ({ direction }) => {
      const room = rooms.get(socket.data.roomId);
      if (!room) return;

      const paddle =
        socket.data.side === "left"
          ? room.state.paddles.left
          : room.state.paddles.right;

      paddle.y += direction * paddle.speed;
      paddle.y = Math.max(0, Math.min(paddle.y, room.state.canvas.height - paddle.height));
    });

    socket.on("disconnect", () => {
      console.log(`🔴 ${socket.id} disconnected`);

      for (const [key, s] of waitingPlayers.entries()) {
        if (s.id === socket.id) {
          waitingPlayers.delete(key);
          break;
        }
      }

      if (socket.data.roomId) {
        const roomId = socket.data.roomId;
        const room = rooms.get(roomId);

        if (room) {
          const opponentSide =
            socket.data.side === "left" ? "right" : "left";

          io.to(roomId).emit("opponentDisconnected", {
            winner: opponentSide,
            reason: "disconnect",
          });

          rooms.delete(roomId);
        }
      }
    });

    setInterval(() => {
      for (const roomId of rooms.keys()) updateGame(roomId, io);
    }, 16);
  });
};
