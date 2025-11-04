import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";

const fastify = Fastify();
await fastify.register(cors, { origin: "*" });

// Create HTTP server for Socket.IO
const server = fastify.server;
const io = new Server(server, {
  cors: { origin: "*" },
});

// Structure to hold waiting players based on customization
const waitingPlayers = new Map(); // key = JSON.stringify({map,powerUps,speed}) -> socket
const rooms = new Map();

// ---------------- Game Logic ----------------
function initGameState() {
  return {
    ball: { x: 400, y: 250, vx: 3, vy: 2 },
    paddles: { left: 200, right: 200 },
  };
}

function createRoom(p1, p2, configKey) {
  const id = Date.now().toString();
  const state = initGameState();
  rooms.set(id, { players: [p1, p2], state, configKey });

  p1.join(id);
  p2.join(id);

  p1.data.side = "left";
  p2.data.side = "right";
  p1.data.roomId = id;
  p2.data.roomId = id;

  p1.emit("start", { side: "left", roomId: id });
  p2.emit("start", { side: "right", roomId: id });

  console.log(`✅ Room ${id} created for config ${configKey}`);
  console.log(`   ↳ ${p1.id} (left) vs ${p2.id} (right)`);
}

function updateGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const { ball, paddles } = room.state;

  // Basic physics
  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.y <= 0 || ball.y >= 500) ball.vy *= -1;
  if (ball.x <= 20 && Math.abs(ball.y - paddles.left - 50) < 60) ball.vx *= -1;
  if (ball.x >= 780 && Math.abs(ball.y - paddles.right - 50) < 60) ball.vx *= -1;

  io.to(roomId).emit("state", { ball, paddles });
}

// Run game updates every 16ms (~60 FPS)
setInterval(() => {
  for (const roomId of rooms.keys()) updateGame(roomId);
}, 16);

// ---------------- Socket.IO Events ----------------
io.on("connection", (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  // Player joins queue with selected configuration
  socket.on("joinGame", ({ map = "Classic", powerUps = false, speed = "Normal" }) => {
    const configKey = JSON.stringify({ map, powerUps, speed });

    console.log(`🎮 ${socket.id} wants to play -> ${configKey}`);

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
      createRoom(opponent, socket, configKey);
      
    }
  });

  socket.on("move", ({ dy }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    if (socket.data.side === "left") room.state.paddles.left += dy;
    else room.state.paddles.right += dy;
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
        io.to(roomId).emit("end");
        rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} deleted`);
      }
    }
  });
});

// ---------------- Start Server ----------------
await fastify.listen({ port: 8080 });
console.log("🚀 Socket.IO server running on ws://localhost:8080");
