// gameGateway.ts
import { FastifyInstance } from "fastify";
import { Socket } from "socket.io";
import { createRoom, rooms, updateGame } from "./game.controller";
import { saveGameResult } from "../plugins/game.db";

export const gameGateway = (namespace: any, fastify: FastifyInstance) => {
  // ✅ Store fastify instance on namespace so we can access it later
  namespace.fastify = fastify;

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

      // Determine which paddle to move based on socket position in players array
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      const paddle = playerIndex === 0 ? room.state.paddles.left : room.state.paddles.right;

      paddle.y += direction * paddle.speed;
      paddle.y = Math.max(0, Math.min(paddle.y, room.state.canvas.height - paddle.height));
    });

    socket.on("restart", () => {
      const room = rooms.get(socket.data.roomId);
      if (!room) return;

      // Determine which side wants to restart
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      const side = playerIndex === 0 ? "left" : "right";

      // Mark this player as ready to restart
      room.restartReady[side] = true;

      // Notify all players of restart readiness
      namespace.to(socket.data.roomId).emit("restartReady", {
        leftReady: room.restartReady.left,
        rightReady: room.restartReady.right,
      });

      // If both players are ready, restart the game
      if (room.restartReady.left && room.restartReady.right) {
        console.log(`🔄 Restarting game ${socket.data.roomId}...`);
        
        // Reset game state
        room.state.scores.left = 0;
        room.state.scores.right = 0;
        room.state.winner = null;
        room.restartReady = { left: false, right: false };
        
        // Reset ball
        room.state.ball.x = room.state.canvas.width / 2;
        room.state.ball.y = room.state.canvas.height / 2;
        room.state.ball.vx = 4 * room.state.ball.speed * (Math.random() > 0.5 ? 1 : -1);
        room.state.ball.vy = 3 * room.state.ball.speed * (Math.random() > 0.5 ? 1 : -1);
        
        // Reset paddles
        room.state.paddles.left.y = (room.state.canvas.height - room.state.paddles.left.height) / 2;
        room.state.paddles.right.y = (room.state.canvas.height - room.state.paddles.right.height) / 2;

        // Reset power-up
        room.state.powerUp.found = false;
        room.state.powerUp.visible = false;
        room.state.powerUp.spawnTime = null;

        // Restart the game loop (it was stopped when winner was declared)
        if (room.intervalId) {
          clearInterval(room.intervalId);
        }
        room.intervalId = setInterval(() => {
          updateGame(socket.data.roomId);
        }, 16); // 60fps

        namespace.to(socket.data.roomId).emit("gameRestarted");
        
        console.log(`✅ Game ${socket.data.roomId} restarted - Scores: ${room.state.scores.left}-${room.state.scores.right}`);
      }
    });

    // socket.on("leavePostGame", async () => {
    //   console.log(`🚪 ${socket.id} left post-game`);

    //   if (socket.data.roomId) {
    //     const roomId = socket.data.roomId;
    //     const room = rooms.get(roomId);

    //     if (room) {
    //       // Notify opponent that this player left after game over
    //       socket.to(roomId).emit("opponentLeftPostGame");

    //       // Remove this player from the room but don't delete the room yet
    //       const playerIndex = room.players.findIndex(p => p.id === socket.id);
    //       if (playerIndex !== -1) {
    //         room.players.splice(playerIndex, 1);
    //       }

    //       // If no players left in room, clean up
    //       if (room.players.length === 0) {
    //         if (room.intervalId) {
    //           clearInterval(room.intervalId);
    //         }
    //         rooms.delete(roomId);
    //         console.log(`🗑️ Room ${roomId} deleted - no players remaining`);
    //       }
    //     }
    //   }

    //   // Disconnect the socket
    //   socket.disconnect();
    // });

    socket.on("disconnect", async () => {
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
          // Check if game was active (no winner yet) or finished
          const gameActive = !room.state.winner;
          
          // Determine opponent's userId
          const disconnectedPlayerIndex = room.players.findIndex(p => p.id === socket.id);
          const opponentUserId = disconnectedPlayerIndex === 0 
            ? room.playerProfiles.right.id 
            : room.playerProfiles.left.id;

          // Save forfeit game to database if game was active
          if (gameActive) {
            try {
              const db = fastify?.db;
              
              if (db) {
                // Set score to 5-0 for forfeit win
                const isLeftPlayerWinner = disconnectedPlayerIndex === 0 ? false : true;
                
                await saveGameResult(db, {
                  gameId: roomId,
                  mode: room.options.mode || 'online',
                  player1Id: room.playerProfiles.left.id,
                  player2Id: room.playerProfiles.right.id,
                  winnerId: opponentUserId,
                  score1: isLeftPlayerWinner ? 5 : 0,
                  score2: isLeftPlayerWinner ? 0 : 5,
                  createdAt: Date.now(),
                });
                console.log("✅ Forfeit game result saved successfully");
              } else {
                console.error("❌ Database not available for saving forfeit game");
              }
            } catch (error) {
              console.error("❌ Failed to save forfeit game result:", error);
            }
          }

          namespace.to(roomId).emit("opponentDisconnected", {
            winnerId: opponentUserId,
            reason: "disconnect",
            gameActive: gameActive, // flag to indicate if game was active
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
