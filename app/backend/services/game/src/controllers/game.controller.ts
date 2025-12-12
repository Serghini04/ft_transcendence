// gameController.ts
import { saveGameResult } from "../plugins/game.db";
import { Socket } from "socket.io";

interface PlayerProfile {
  id: string; // User IDs are strings (from auth/JWT)
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
  winner: string | null; // Now stores user ID instead of side
}

interface Room {
  players: Socket[];
  state: GameState;
  configKey: string;
  options: any;
  startTime: number;
  playerProfiles: { left: PlayerProfile; right: PlayerProfile };
  restartReady: { left: boolean; right: boolean };
  namespace: any; // Store namespace reference for emit
  intervalId?: NodeJS.Timeout; // Store the game loop interval
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
      vx: 4 * speed, // Apply speed multiplier here once
      vy: 3 * speed,
      speed, // Keep for reference
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

export async function createRoom(
  p1: Socket,
  p2: Socket,
  configKey: string,
  options: any,
  namespace: any
) {
  const id = Date.now().toString();
  const state = initGameState(options.powerUps, speedMap[options.speed]);

  // Socket auth passes userId as string from JWT
  const player1Profile: PlayerProfile = { id: String(p1.handshake.auth?.userId) };
  const player2Profile: PlayerProfile = { id: String(p2.handshake.auth?.userId) };

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
    namespace,
  });

  p1.join(id);
  p2.join(id);

  p1.data.roomId = id;
  p2.data.roomId = id;

  p1.emit("start", {
    roomId: id,
    opponentId: player2Profile.id,
    yourId: player1Profile.id,
    position: "left",
  });

  p2.emit("start", {
    roomId: id,
    opponentId: player1Profile.id,
    yourId: player2Profile.id,
    position: "right",
  });

  console.log(`✅ Room ${id} created with players:`, player1Profile.id, player2Profile.id);

  // Start the game loop for this room only
  const room = rooms.get(id);
  if (room) {
    room.intervalId = setInterval(() => {
      updateGame(id);
    }, 16); // 60fps
  }
}

function resetBall(state: GameState) {
  const ball = state.ball;
  ball.x = state.canvas.width / 2;
  ball.y = state.canvas.height / 2;
  // Reapply speed multiplier when resetting
  ball.vx = 4 * ball.speed * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = 3 * ball.speed * (Math.random() > 0.5 ? 1 : -1);
}

export async function updateGame(roomId: string) {
   const room = rooms.get(roomId);
   if (!room) return;
  
   const { namespace } = room; // Get namespace from room
   
   // Stop game loop if there's a winner
   if (room.state.winner) {
     if (room.intervalId) {
       clearInterval(room.intervalId);
       room.intervalId = undefined;
     }
     return;
   }
 
   const { ball, paddles, scores, powerUp } = room.state;
 
   // Speed is already applied in vx/vy during init
   ball.x += ball.vx;
   ball.y += ball.vy;
 
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
 
   // ✅ Await the win handler
   await handleWin(room, roomId, namespace);
 
   handlePowerUps(room.state);

   namespace.to(roomId).emit("state", room.state);
   // Uncomment for debugging, but it will spam console
   // console.log(`🏓 Room ${roomId} state updated:`, { ball, paddles, scores });
 }
 
async function handleWin(room: Room, roomId: string, namespace: any) {
  const { scores } = room.state;
  const { playerProfiles } = room;

  if (scores.left >= 5 || scores.right >= 5) {
    const winnerSide = scores.left >= 5 ? "left" : "right";
    
    const winnerProfile = playerProfiles[winnerSide];

    room.state.winner = winnerProfile.id;

    console.log("💾 Saving game result:", {
      gameId: roomId,
      winnerId: winnerProfile.id,
      scores,
    });

    try {
      // ✅ Access database through namespace.fastify
      const db = namespace.fastify?.db;
      
      if (!db) {
        console.error("❌ Database not available for saving game result");
        console.error("namespace.fastify:", namespace.fastify);
        // Still emit gameOver even if DB save fails
      } else {
        await saveGameResult(db, {
          gameId: roomId,
          mode: room.options.mode,
          player1Id: playerProfiles.left.id,
          player2Id: playerProfiles.right.id,
          winnerId: winnerProfile.id,
          score1: scores.left,
          score2: scores.right,
          createdAt: Date.now(),
        });
        console.log("✅ Game result saved successfully");
      }
    } catch (error) {
      console.error("❌ Failed to save game result:", error);
    }

    namespace.to(roomId).emit("gameOver", {
      winnerId: winnerProfile.id
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

  if (powerUp.visible && powerUp.spawnTime !== null && Date.now() - powerUp.spawnTime > powerUp.duration) {
    powerUp.visible = false;
  }
}
