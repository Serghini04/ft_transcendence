// gameGateway.ts
import { FastifyInstance } from "fastify";
import { Socket } from "socket.io";
import { createRoom, rooms, updateGame } from "./game.controller";

export const gameGateway = (namespace: any, fastify: FastifyInstance) => {
  const waitingPlayers = new Map<string, Socket>();

  namespace.on("connection", (socket: any) => {
    console.log(`🟢 ${socket.id} connected`);

    socket.on(
      "joinGame",
      async ({
        userId,
        options = { map: "Classic", powerUps: false, speed: "Normal" },
      }: any) => {
        try {
          console.log("debuuuuuug: joining game", userId, options);
          const configKey = JSON.stringify(options);
          const waiting = waitingPlayers.get(configKey);

          if (!waiting) {
            waitingPlayers.set(configKey, socket);
            socket.emit("waiting");
          } else {
            waitingPlayers.delete(configKey);
            // ✅ FIX 1: Pass 'namespace' as the 5th argument
            await createRoom(waiting, socket, configKey, options, namespace);
          }
        }
        catch (error) {
          console.error("Error fetching user profile:", error);
          socket.emit("error", { message: "Failed to join game." });
        }
      }
    );

    socket.on("move", ({ direction }: any) => {
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

          namespace.to(roomId).emit("opponentDisconnected", {
            winner: opponentSide,
            reason: "disconnect",
          });

          // ✅ FIX 2: Clear the room-specific interval
          if (room.intervalId) {
            clearInterval(room.intervalId);
          }

          rooms.delete(roomId);
        }
      }
    });

    // ❌ FIX 3: DELETE THIS ENTIRE BLOCK
    // The game loop is now started inside createRoom() in game.controller.ts
    /*
    setInterval(() => {
      for (const roomId of rooms.keys()) updateGame(roomId, namespace);
    }, 16);
    */
  });
};
