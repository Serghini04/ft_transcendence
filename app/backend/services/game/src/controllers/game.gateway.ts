// gameGateway.ts
import { FastifyInstance } from "fastify";
import { Socket } from "socket.io";
import { createRoom, createTournamentRoom, rooms, updateGame } from "./game.controller";
import { saveGameResult } from "../plugins/game.db";

// Export these for HTTP routes to access
export const userSocketMap = new Map<number, Socket>();
export const pendingChallenges = new Map<string, any>();
export const challengeRooms = new Map<string, any>(); // roomId -> { player1Id, player2Id, connectedSockets: [] }

export const gameGateway = (namespace: any, fastify: FastifyInstance) => {
  // ✅ Store fastify instance on namespace so we can access it later
  namespace.fastify = fastify;

  const waitingPlayers = new Map<string, Socket>();
  const tournamentWaitingPlayers = new Map<string, any>(); // roomId -> { socket, userId, matchId, tournamentId }

  namespace.on("connection", (socket: any) => {
    console.log(`🟢 ${socket.id} connected`);
    
    // Store user socket mapping if userId is available
    if (socket.handshake.auth.userId) {
      userSocketMap.set(socket.handshake.auth.userId, socket);
    }

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
            await createRoom(waiting, socket, configKey, options, namespace);
          }
        }
        catch (error) {
          console.error("Error fetching user profile:", error);
          socket.emit("error", { message: "Failed to join game." });
        }
      }
    );
    
    // Handle joining a challenge room
    socket.on("joinChallengeRoom", async ({ roomId, userId }: any) => {
      console.log(`🎮 ${userId} joining challenge room ${roomId}`);
      
      const challengeRoom = challengeRooms.get(roomId);
      if (!challengeRoom) {
        socket.emit("error", { message: "Challenge room not found or expired" });
        return;
      }
      
      // Add socket to connected sockets
      challengeRoom.connectedSockets.push(socket);
      
      // Check if both players have connected
      if (challengeRoom.connectedSockets.length === 2) {
        console.log(`✅ Both players connected to challenge room ${roomId}, starting game...`);
        
        // Remove from pending challenge rooms
        challengeRooms.delete(roomId);
        
        // Create the actual game room
        const [socket1, socket2] = challengeRoom.connectedSockets;
        await createRoom(socket1, socket2, "challenge", challengeRoom.options, namespace);
      } else {
        console.log(`⏳ Waiting for other player to join challenge room ${roomId}`);
        socket.emit("waiting");
      }
    });

    // Handle joining a tournament match
    socket.on("joinTournamentMatch", async ({ 
      tournamentId, 
      matchId, 
      userId, 
      opponentId, 
      options 
    }: any) => {
      console.log(`🏆 Tournament match join request:`, {
        tournamentId,
        matchId,
        userId,
        opponentId,
        socketId: socket.id
      });
      
      // Create unique room ID for this specific tournament match
      const roomId = `tournament-${tournamentId}-${matchId}`;
      console.log(`🔑 Generated roomId: ${roomId}`);
      
      // Check if opponent is already waiting
      const waitingPlayer = tournamentWaitingPlayers.get(roomId);
      console.log(`🔍 Checking waiting queue for roomId ${roomId}:`, {
        hasWaitingPlayer: !!waitingPlayer,
        waitingPlayerId: waitingPlayer?.userId,
        currentPlayerId: userId,
        allWaitingRooms: Array.from(tournamentWaitingPlayers.keys())
      });
      
      if (!waitingPlayer) {
        // First player to join - store and wait
        tournamentWaitingPlayers.set(roomId, {
          socket,
          userId,
          matchId,
          tournamentId,
          options
        });
        socket.emit("waiting");
        console.log(`⏳ ${userId} (socket ${socket.id}) waiting for opponent in tournament match ${matchId}`);
        console.log(`📊 Current waiting players:`, Array.from(tournamentWaitingPlayers.keys()));
      } else {
        // Verify this is the correct opponent
        console.log(`👥 Found waiting player ${waitingPlayer.userId}, current player ${userId}`);
        
        // Second player joined - start the match!
        tournamentWaitingPlayers.delete(roomId);
        
        console.log(`✅ Both players ready for tournament match ${matchId}, starting game...`);
        console.log(`📊 Remaining waiting players:`, Array.from(tournamentWaitingPlayers.keys()));
        
        try {
          // Create the tournament game room
          console.log(`🎮 Calling createTournamentRoom with:`, {
            player1Socket: waitingPlayer.socket.id,
            player2Socket: socket.id,
            roomId,
            tournamentId,
            matchId
          });
          
          await createTournamentRoom(
            waitingPlayer.socket,
            socket,
            roomId,
            options,
            namespace,
            {
              tournamentId,
              matchId
            }
          );
          
          console.log(`✅ createTournamentRoom completed for ${roomId}`);
        } catch (error) {
          console.error(`❌ Error creating tournament room:`, error);
          socket.emit("error", { message: "Failed to create tournament match" });
          waitingPlayer.socket.emit("error", { message: "Failed to create tournament match" });
        }
      }
    });

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

    socket.on("game:challenge:accept", async ({ challengeId }: any) => {
      console.log(`✅ Challenge ${challengeId} accepted`);
      
      const challenge = pendingChallenges.get(challengeId);
      if (!challenge) {
        socket.emit("game:challenge:unavailable", { reason: "Challenge expired or not found" });
        return;
      }
      
      // Remove from pending
      pendingChallenges.delete(challengeId);
      
      // Generate room ID
      const roomId = `challenge_room_${Date.now()}`;
      
      // Create pending challenge room (waiting for both players to connect)
      challengeRooms.set(roomId, {
        player1Id: challenge.challengerId,
        player2Id: challenge.challengedId,
        options: { map: "Classic", powerUps: false, speed: "Normal", mode: "online" },
        connectedSockets: [],
        createdAt: Date.now(),
      });
      
      // Notify both players with the room ID
      challenge.challengerSocket.emit("game:challenge:accepted", { challengeId, gameRoomId: roomId });
      challenge.challengedSocket.emit("game:challenge:accepted", { challengeId, gameRoomId: roomId });
      
      console.log(`🎮 Challenge room ${roomId} created, waiting for both players to connect`);
      
      // Auto-cleanup after 1 minute if players don't connect
      setTimeout(() => {
        if (challengeRooms.has(roomId)) {
          console.log(`⏰ Challenge room ${roomId} expired`);
          challengeRooms.delete(roomId);
        }
      }, 60000);
    });
    
    socket.on("game:challenge:decline", ({ challengeId }: any) => {
      console.log(`❌ Challenge ${challengeId} declined`);
      
      const challenge = pendingChallenges.get(challengeId);
      if (challenge) {
        pendingChallenges.delete(challengeId);
        challenge.challengerSocket.emit("game:challenge:declined", { challengeId });
        console.log(`Challenge ${challengeId} removed from pending`);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`🔴 ${socket.id} disconnected`);
      
      // Remove from userSocketMap
      if (socket.handshake.auth.userId) {
        userSocketMap.delete(socket.handshake.auth.userId);
      }

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

  });
};
