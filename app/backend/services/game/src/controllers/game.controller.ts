// gameController.ts
import { saveGameResult } from "../plugins/game.db";
import { Socket } from "socket.io";

interface PlayerProfile {
  id: number;
  name: string;
  avatar: string;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Ball {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
  visible: boolean;
}

interface PowerUp {
  found: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  duration: number;
  spawnTime: number | null;
}

interface GameState {
  canvas: { width: number; height: number };
  ball: Ball;
  paddles: { left: Paddle; right: Paddle };
  scores: { left: number; right: number };
  powerUp: PowerUp;
  winner: "left" | "right" | null;
}

interface Room {
  players: Socket[];
  state: GameState;
  configKey: string;
  options: any;
  startTime: number;
  playerProfiles: { left: PlayerProfile; right: PlayerProfile };
  restartReady: { left: boolean; right: boolean };
}

export const rooms = new Map<string, Room>();

const speedMap: Record<string, number> = {
  Slow: 0.8,
  Normal: 1.3,
  Fast: 2.5,
};

function initGameState(powerUps: boolean, speed: number): GameState {
  return {
    canvas: { width: 1200, height: 675 },
    ball: {
      x: 600,
      y: 337.5,
      radius: 8,
      vx: 4,
      vy: 3,
      speed,
      visible: true,
    },
    paddles: {
      left: {
        x: 0,
        y: 337.5 - 45,
        width: 10,
        height: 90,
        speed: 6 * speed,
      },
      right: {
        x: 1200 - 10,
        y: 337.5 - 45,
        width: 10,
        height: 90,
        speed: 6 * speed,
      },
    },
    scores: { left: 0, right: 0 },
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
    winner: null,
  };
}

// mock — you must replace with your real fetch service
async function getUserProfile(userId: number): Promise<PlayerProfile> {
  return { id: userId, name: "Player " + userId, avatar: "" };
}

export async function createRoom(
  p1: Socket,
  p2: Socket,
  configKey: string,
  options: any
) {
  const id = Date.now().toString();
  const state = initGameState(options.powerUps, speedMap[options.speed]);

  const [player1Profile, player2Profile] = await Promise.all([
    getUserProfile(p1.data.userId),
    getUserProfile(p2.data.userId),
  ]);

  rooms.set(id, {
    players: [p1, p2],
    state,
    configKey,
    options,
    startTime: Date.now(),
    playerProfiles: {
      left: player1Profile,
      right: player2Profile,
    },
    restartReady: { left: false, right: false },
  });

  p1.join(id);
  p2.join(id);

  p1.data.side = "left";
  p2.data.side = "right";
  p1.data.roomId = id;
  p2.data.roomId = id;

  p1.emit("start", {
    side: "left",
    roomId: id,
    opponent: player2Profile,
    you: player1Profile,
  });

  p2.emit("start", {
    side: "right",
    roomId: id,
    opponent: player1Profile,
    you: player2Profile,
  });

  console.log(`Room ${id} created`);
}

function resetBall(state: GameState) {
  const ball = state.ball;
  ball.x = state.canvas.width / 2;
  ball.y = state.canvas.height / 2;
  ball.vx = 4 * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
}

export function updateGame(roomId: string, io: any) {
  const room = rooms.get(roomId);
  if (!room || room.state.winner) return;

  const { ball, paddles, scores, powerUp } = room.state;

  ball.x += ball.vx * ball.speed;
  ball.y += ball.vy * ball.speed;

  // Paddle collisions
  const left = paddles.left;
  if (
    ball.x - ball.radius <= left.x + left.width &&
    ball.y >= left.y &&
    ball.y <= left.y + left.height
  ) {
    ball.vx = Math.abs(ball.vx);
    ball.x = left.x + left.width + ball.radius;
  }

  const right = paddles.right;
  if (
    ball.x + ball.radius >= right.x &&
    ball.y >= right.y &&
    ball.y <= right.y + right.height
  ) {
    ball.vx = -Math.abs(ball.vx);
    ball.x = right.x - ball.radius;
  }

  // Wall bounce
  if (
    ball.y - ball.radius <= 0 ||
    ball.y + ball.radius >= room.state.canvas.height
  )
    ball.vy *= -1;

  // Scoring
  if (ball.x < 0) {
    scores.right++;
    resetBall(room.state);
  } else if (ball.x > room.state.canvas.width) {
    scores.left++;
    resetBall(room.state);
  }

  // Win logic
  handleWin(room, roomId, io);

  // Power-up logic
  handlePowerUps(room.state);

  io.to(roomId).emit("state", room.state);
}

function handleWin(room: Room, roomId: string, io: any) {
  const { scores, playerProfiles } = room.state;

  if (scores.left >= 5 || scores.right >= 5) {
    const winner = scores.left >= 5 ? "left" : "right";
    room.state.winner = winner;

    const winnerProfile = playerProfiles[winner];
    const loserProfile =
      winner === "left" ? playerProfiles.right : playerProfiles.left;

    saveGameResult({
      gameId: roomId,
      mode: "online",
      player1: {
        ...playerProfiles.left,
        score: scores.left,
      },
      player2: {
        ...playerProfiles.right,
        score: scores.right,
      },
      winner: { id: winnerProfile.id },
      createdAt: room.startTime,
    });

    io.to(roomId).emit("gameOver", {
      winner,
      winnerProfile,
      loserProfile,
      scores,
    });
  }
}

function handlePowerUps(state: GameState) {
  const { powerUp, ball } = state;

  if (!powerUp.found) return;

  if (!powerUp.visible) {
    if (
      powerUp.spawnTime === null ||
      Date.now() - powerUp.spawnTime > 8000
    ) {
      powerUp.x = state.canvas.width / 2 + (Math.random() * 100 - 100);
      powerUp.y = state.canvas.height / 2 + (Math.random() * 100 - 100);
      powerUp.visible = true;
      powerUp.spawnTime = Date.now();
    }
  } else {
    if (
      ball.x + ball.radius >= powerUp.x &&
      ball.x - ball.radius <= powerUp.x + powerUp.width &&
      ball.y + ball.radius >= powerUp.y &&
      ball.y - ball.radius <= powerUp.y + powerUp.height
    ) {
      ball.vx *= -1;
      powerUp.visible = false;
    }
  }

  if (powerUp.visible && Date.now() - powerUp.spawnTime > powerUp.duration) {
    powerUp.visible = false;
  }
}
