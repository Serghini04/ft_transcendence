import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";

const fastify = Fastify();
await fastify.register(websocketPlugin);

let waitingPlayer = null;
const rooms = new Map();

function initGameState() {
  return {
    ball: { x: 400, y: 250, vx: 3, vy: 2 },
    paddles: { left: 200, right: 200 },
  };
}

function createRoom(p1, p2) {
  const id = Date.now().toString();
  rooms.set(id, { players: [p1, p2], state: initGameState() });
  p1.roomId = id;
  p2.roomId = id;

  p1.send(JSON.stringify({ type: "start", side: "left", roomId: id }));
  p2.send(JSON.stringify({ type: "start", side: "right", roomId: id }));

  console.log(`✅ Room ${id} created`);
}

function updateGame(room) {
  const { ball, paddles } = room.state;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y <= 0 || ball.y >= 500) ball.vy *= -1;
  if (ball.x <= 20 && Math.abs(ball.y - paddles.left - 50) < 60) ball.vx *= -1;
  if (ball.x >= 780 && Math.abs(ball.y - paddles.right - 50) < 60) ball.vx *= -1;

  room.players.forEach((p) => {
    if (p.readyState === 1)
      p.send(JSON.stringify({ type: "state", ball, paddles }));
  });
}

setInterval(() => {
  for (const room of rooms.values()) updateGame(room);
}, 16);

fastify.get("/ws", { websocket: true }, (connection) => {
  const ws = connection.socket;

  console.log("🟢 New client connected");

  // Only assign as waiting player if there is none
  if (waitingPlayer === null) {
    waitingPlayer = ws;
    console.log("🕓 Player is waiting...");
    ws.send(JSON.stringify({ type: "waiting" }));
  } else {
    // Found opponent, create room
    const opponent = waitingPlayer;
    waitingPlayer = null; // clear waiting slot
    console.log("🎯 Found opponent! Creating room...");
    createRoom(opponent, ws);
  }

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    const room = rooms.get(ws.roomId);
    if (!room) return;

    if (data.type === "move") {
      if (data.side === "left") room.state.paddles.left += data.dy;
      else room.state.paddles.right += data.dy;
    }
  });

  ws.on("close", () => {
    console.log("🔴 Client disconnected");
    if (waitingPlayer === ws) {
      waitingPlayer = null;
      console.log("🕓 Waiting player left");
    }
    if (ws.roomId) {
      rooms.delete(ws.roomId);
      console.log(`🗑️ Room ${ws.roomId} deleted`);
    }
  });
});

await fastify.listen({ port: 8080 });
console.log("🚀 Fastify WebSocket server running on ws://localhost:8080/ws");
