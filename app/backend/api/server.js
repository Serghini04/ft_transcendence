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


const speedMap = { Slow: 0.8, Normal: 1.3, Fast: 2.5 };
// ---------------- Game Logic ----------------
function initGameState(powerUps, speed) {
  const multiplier = speedMap[speed] || 1.3;
  return {
    canvas: {
      width: 1200,
      height: 675,
    },
    ball: {
      x: 600,
      y: 337.5,
      radius: 8,
      vx: 4,
      vy: 3,
      speed: multiplier,
      visible: true,     // can hide during power-ups or transitions
    },
    paddles: {
      left: {
        x: 0,
        y: 337.5 - 45,
        width: 10,
        height: 90,
        speed: 10 * multiplier,       // movement per frame on key press
      },
      right: {
        x: 1200 - 10,
        y: 337.5 - 45,
        width: 10,
        height: 90,
        speed: 10 * multiplier,
      },
    },
    scores: {
      left: 0,
      right: 0,
    },
    powerUp: {
      found: powerUps,
      x: 350,
      y: 200,
      width: 12,
      height: 150,
      visible: false,
      duration: 4000,
      spawnTime: null,
    },
    winner : null,
  };
}


function createRoom(p1, p2, configKey, options) {
  const id = Date.now().toString();
  const state = initGameState(options.powerUps, options.speed);
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

function resetBall(state) {
  const { ball } = state;
  ball.x = state.canvas.width / 2;
  ball.y = state.canvas.height / 2;
  ball.vx = 4 * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
}

function updateGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const { ball, paddles, scores, powerUp } = room.state;

  // Move ball
  ball.x += ball.vx * ball.speed;
  ball.y += ball.vy * ball.speed;

  // Top/bottom wall collision
  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= room.state.canvas.height)
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
    resetBall(room.state);
  } else if (ball.x > room.state.canvas.width) {
    scores.left += 1;
    resetBall(room.state);
  }

  // win condition
  if (scores.left >= 5) {
    room.state.winner = "left";
  } else if (scores.right >= 5) {
    room.state.winner = "right";
  }

  if (room.state.winner) return;

  handlePowerUps(room.state);
  // Emit full state including scores so the client can render them
  io.to(roomId).emit("state", room.state);
}

function handlePowerUps(state) {
  const { powerUp, ball } = state;

  if (!powerUp.found) return;

  if (!powerUp.visible) {
    // Randomly spawn power-up
    if (powerUp.spawnTime === null || Date.now() - powerUp.spawnTime + powerUp.duration > 7000) {
      powerUp.x = state.canvas.width / 2 + (Math.random() * 100 - 100);
      powerUp.y = state.canvas.height / 2 + (Math.random() * 100 - 100);
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
      ball.vx *= -1;
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
  socket.on("joinGame", ( options = { map: "Classic", powerUps: false, speed: "Normal" }) => {
    const configKey = JSON.stringify(options);
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
      createRoom(opponent, socket, configKey, options);
      
    }
  });

  socket.on("move", ({ direction }) => {
    console.log("**************************");
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    console.log("move " + `${socket.data.side} to ${direction}`);
    if (socket.data.side === "left")
    {
      room.state.paddles.left.y += direction * room.state.paddles.left.speed;
      room.state.paddles.left.y = Math.min(room.state.paddles.left.y, room.state.canvas.height - room.state.paddles.left.height);
    }
    else
    {
      room.state.paddles.right.y += direction * room.state.paddles.right.speed;
      room.state.paddles.right.y = Math.min(room.state.paddles.right.y, room.state.canvas.height - room.state.paddles.right.height);
    }
  });

  socket.on("restart", () => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room) return;
    room.state = initGameState(room.state.powerUp.found, room.state.ball.speed);
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
