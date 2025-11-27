import { Server } from "socket.io";
import { createRoom, updateGame } from "./gameController.js";

export const gameGateway = (fastify) => {
	// Create HTTP server for Socket.IO
	const server = fastify.server;
	const io = new Server(server, {
	cors: { origin: "*" },
	});

	// Structure to hold waiting players based on customization
	const waitingPlayers = new Map(); // key = JSON.stringify({map,powerUps,speed}) -> socket
	const rooms = new Map();


	io.on("connection", (socket) => {
		console.log(`🟢 ${socket.id} connected`);
	
		// Player joins queue with selected configuration
		socket.on("joinGame", async ({ userId, options = { map: "Classic", powerUps: false, speed: "Normal" } }) => {
			// Store userId on socket
			socket.data.userId = userId || socket.id;
			
			const configKey = JSON.stringify(options);
			console.log(`🎮 ${socket.id} (${socket.data.userId}) wants to play -> ${configKey}`);
			const waiting = waitingPlayers.get(configKey);
		
			if (!waiting) {
				// No one waiting for this config
				waitingPlayers.set(configKey, socket);
				socket.emit("waiting");
				console.log(`🕓 ${socket.id} is waiting for a match...`);
			} else {
				// Found opponent with same config
				const opponent = waiting;
				waitingPlayers.delete(configKey);
				console.log(`🎯 Match found: ${socket.id} vs ${opponent.id} for ${configKey}`);
				await createRoom(opponent, socket, configKey, options);
				
			}
		});
  
		socket.on("move", ({ direction }) => {
			const room = rooms.get(socket.data.roomId);
			if (!room) return;
			if (socket.data.side === "left")
			{
				room.state.paddles.left.y += direction * room.state.paddles.left.speed;
				room.state.paddles.left.y = Math.min(room.state.paddles.left.y, room.state.canvas.height - room.state.paddles.left.height);
				room.state.paddles.left.y = Math.max(room.state.paddles.left.y, 0);
			}
			else
			{
				room.state.paddles.right.y += direction * room.state.paddles.right.speed;
				room.state.paddles.right.y = Math.min(room.state.paddles.right.y, room.state.canvas.height - room.state.paddles.right.height);
				room.state.paddles.right.y = Math.max(room.state.paddles.right.y, 0);
			}
		});
  
		socket.on("restart", () => {
			const roomId = socket.data.roomId;
			const room = rooms.get(roomId);
			if (!room) return;
			
			const playerSide = socket.data.side;
			
			// Mark this player as ready to restart
			room.restartReady[playerSide] = true;
			
			console.log(`🔄 ${socket.id} (${playerSide}) is ready to restart`);
			
			// Notify the other player that this player is ready
			io.to(roomId).emit("restartReady", { 
				side: playerSide,
				leftReady: room.restartReady.left,
				rightReady: room.restartReady.right
			});
			
			// If both players are ready, restart the game
			if (room.restartReady.left && room.restartReady.right) {
				console.log(`✅ Both players ready, restarting room ${roomId}`);
				room.state = initGameState(room.state.powerUp.found, room.state.ball.speed);
				room.restartReady = { left: false, right: false }; // Reset ready states
				io.to(roomId).emit("gameRestarted");
			}
		});
  
		socket.on("disconnect", () => {
			console.log(`🔴 ${socket.id} disconnected`);
		
			// Remove from waiting queue if present
			for (const [key, s] of waitingPlayers.entries()) {
				if (s.id === socket.id) {
				waitingPlayers.delete(key);
				console.log(`🕓 Removed ${socket.id} from waiting queue`);
				break;
				}
			}
		
			// Clean up room if inside one
			if (socket.data?.roomId) {
				const roomId = socket.data.roomId;
				const room = rooms.get(roomId);
				if (room) {
				const disconnectedSide = socket.data.side;
				const opponentSide = disconnectedSide === "left" ? "right" : "left";
				
				// Notify opponent that they won by forfeit
				io.to(roomId).emit("opponentDisconnected", { 
					winner: opponentSide,
					reason: "disconnect"
				});
				
				rooms.delete(roomId);
				console.log(`🗑️ Room ${roomId} deleted - ${disconnectedSide} player disconnected`);
				}
			}
		});

		// Run game updates every 16ms (~60 FPS)
		setInterval(() => {
			for (const roomId of rooms.keys()) updateGame(roomId, rooms, io);
		}, 16);
	});
};