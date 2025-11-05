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
    ball: {
      x: 400,
      y: 250,
      radius: 8,
      vx: 3,
      vy: 2,
      speed: 1.3,        // multiplier for dynamic difficulty or “speed mode”
      visible: true,     // can hide during power-ups or transitions
    },
    paddles: {
      left: {
        x: 20,
        y: 200,
        width: 10,
        height: 90,
        speed: 10,       // movement per frame on key press
      },
      right: {
        x: 770,
        y: 200,
        width: 10,
        height: 90,
        speed: 10,
      },
    },
    scores: {
      left: 0,
      right: 0,
    },
    powerUp: {
      x: 350,
      y: 200,
      width: 12,
      height: 150,
      visible: false,
      duration: 4000,
      spawnTime: null,
    },
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

function resetBall(ball) {
  ball.x = 400;
  ball.y = 250;
  ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = 2 * (Math.random() > 0.5 ? 1 : -1);
}

function updateGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const { ball, paddles, scores, powerUp } = room.state;

  // Move ball
  ball.x += ball.vx * ball.speed;
  ball.y += ball.vy * ball.speed;

  // Top/bottom wall collision
  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= 500)
    ball.vy *= -1;

   // Collision: left paddle
  const left = paddles.left;
  if (
    ball.x - ball.radius <= left.x + left.width &&
    ball.y >= left.y &&
    ball.y <= left.y + left.height
  )
    ball.vx *= -1;
  
  // Collision: right paddle
  const right = paddles.right;
  if (
    ball.x + ball.radius >= right.x &&
    ball.y >= right.y &&
    ball.y <= right.y + right.height
  )
    ball.vx *= -1;

  // Scoring logic
  if (ball.x < 0) {
    scores.right += 1;
    resetBall(ball);
  } else if (ball.x > 800) {
    scores.left += 1;
    resetBall(ball);
  }


  handlePowerUps(room.state);
  // Emit full state including scores so the client can render them
  io.to(roomId).emit("state", { ball, paddles, scores });
}

function handlePowerUps(state) {
  const { ball, powerUp } = state;

  if (!powerUp.visible) {
    // Randomly spawn power-up
    if (powerUp.spawnTime === null || Date.now() - powerUp.spawnTime + powerUp.duration > 7000) {
      powerUp.x = Math.random() * (800 - powerUp.width);
      powerUp.y = Math.random() * (500 - powerUp.height);
      powerUp.visible = true;
      powerUp.spawnTime = Date.now();
    }
  }
  else {
    // Check collision with ball
    if (
      ball.x + ball.radius >= powerUp.x &&
      ball.x - ball.radius <= powerUp.x + powerUp.width &&
      ball.y + ball.radius >= powerUp.y &&
      ball.y - ball.radius <= powerUp.y + powerUp.height
    ) {
      // Activate power-up effect (e.g., increase ball speed)
      ball.dx *= -1;
    }
  }
  if (powerUp.visible && Date.now() - powerUp.spawnTime > powerUp.duration) {
    powerUp.visible = false;
  }
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
