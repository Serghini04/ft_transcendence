import Fastify from "fastify";
import cors from "@fastify/cors";
import {db} from "./plugins/game.db";
import gameSocket from "./plugins/game.socket";
import { kafkaProducerService } from "./kafka/producer";
import { kafkaConsumerService } from "./kafka/consumer";
import tournamentRoutes from "./routes/tournament.routes";

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  },
});

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
  }
}

// CORS
app.register(cors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
});

// Attach database
app.decorate("db", db);

// Attach socket.io
app.register(gameSocket);

// Register tournament routes
app.register(tournamentRoutes);

// Challenge endpoint
app.post("/api/v1/game/challenge", async (request, reply) => {
  const { challengerId, challengedId } = request.body as { challengerId: number, challengedId: number };
  
  console.log(`🎮 Challenge request: ${challengerId} → ${challengedId}`);
  
  try {
    // ✅ Import the maps from game.gateway
    const gameGatewayModule = await import("./controllers/game.gateway");
    const { userSocketMap, pendingChallenges } = gameGatewayModule;
    const gameSocketModule = await import("./plugins/game.socket");
    const { gameNamespace } = gameSocketModule;
    
    // ✅ Check if userSocketMap exists
    if (!userSocketMap) {
      console.error("❌ userSocketMap is undefined");
      return reply.status(500).send({ error: "Game service not ready" });
    }
    
    if (!gameNamespace) {
      console.error("❌ gameNamespace is undefined");
      return reply.status(500).send({ error: "Game service not ready" });
    }
    
    console.log(`📊 Online users:`, Array.from(userSocketMap.keys()));
    
    // Check if opponent socket exists (is online)
    const opponentSocket = userSocketMap.get(Number(challengedId));
    if (!opponentSocket) {
      console.log(`❌ Opponent ${challengedId} not found in userSocketMap`);
      return reply.status(400).send({ error: "User is offline", message: "This user must be in the game menu to receive challenges" });
    }
    
    // Check if opponent is already in a game
    if (opponentSocket.data.roomId) {
      return reply.status(400).send({ error: "User is currently in a game" });
    }
    
    // Generate challenge ID
    const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Fetch challenger profile
    let challengerData;
    try {
      const challengerRes = await fetch(`http://api-gateway:8080/api/v1/game/user/${challengerId}`, {
        method: "GET",
        headers: { 
          Authorization: request.headers.authorization || '',
          'Content-Type': 'application/json'
        },
      });
      
      if (!challengerRes.ok) {
        console.error(`Failed to fetch challenger profile: ${challengerRes.status}`);
        return reply.status(500).send({ error: "Failed to fetch user profile" });
      }
      
      challengerData = await challengerRes.json() as { username: string; avatarUrl: string };
      console.log(`👤 Challenger data:`, challengerData);
    } catch (error) {
      console.error("Error fetching challenger profile:", error);
      return reply.status(500).send({ error: "Failed to fetch user profile" });
    }
    
    const challengerSocket = userSocketMap.get(Number(challengerId));
    
    pendingChallenges.set(challengeId, {
      challengeId,
      challengerId,
      challengedId,
      challengerSocket,
      challengedSocket: opponentSocket,
      createdAt: Date.now(),
    });

    opponentSocket.emit("game:challenge:received", {
      challengeId,
      challengerId,
      challengerName: challengerData.username,
      challengerAvatar: challengerData.avatarUrl,
    });

    try {
      await kafkaProducerService.publishChallengeNotification(
        challengedId,
        challengerData.username,
        challengeId,
        new Date()
      );
    } catch (kafkaError) {
      console.error(`Failed to publish Kafka challenge notification: ${kafkaError}`);
    }
    
    // Auto-expire after 2 minutes
    setTimeout(() => {
      if (pendingChallenges.has(challengeId)) {
        pendingChallenges.delete(challengeId);
        if (challengerSocket) {
          challengerSocket.emit("game:challenge:expired", { challengeId });
        }
        opponentSocket.emit("game:challenge:expired", { challengeId });
      }
    }, 120000);
    
    return reply.send({ success: true, challengeId });
  } catch (error) {
    console.error("❌ Challenge error:", error);
    return reply.status(500).send({ error: "Failed to send challenge", message: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/api/v1/game/user/:userId", async (request, reply) => {
  const { userId } = request.params as { userId: string };

  const row = db.prepare("SELECT id, name, avatar FROM users WHERE id = ?").get(userId) as { id: string; name: string; avatar: string } | undefined;

  if (row) {
    reply.send({
      id: row.id,
      username: row.name,
      avatarUrl: row.avatar,
    });
  }
  else {
    reply.status(404).send({ message: "User not found" });
  }
});

// Get match history between two users
app.get("/api/v1/game/history/:userId/:opponentId", async (request, reply) => {
  const { userId, opponentId } = request.params as { userId: string; opponentId: string };
  
  try {
    // Get user avatars
    const userRow = db.prepare("SELECT id, name, avatar FROM users WHERE id = ?").get(userId) as { id: string; name: string; avatar: string } | undefined;
    const opponentRow = db.prepare("SELECT id, name, avatar FROM users WHERE id = ?").get(opponentId) as { id: string; name: string; avatar: string } | undefined;
    
    if (!userRow || !opponentRow) {
      return reply.status(404).send({ error: "User not found" });
    }
    
    // Query games where both users participated
    const games = db.prepare(`
      SELECT 
        id,
        player1_id,
        player2_id,
        winner_id,
        score1,
        score2,
        mode,
        created_at
      FROM games 
      WHERE (player1_id = ? AND player2_id = ?) 
         OR (player1_id = ? AND player2_id = ?)
      ORDER BY created_at DESC
      LIMIT 5
    `).all(userId, opponentId, opponentId, userId) as any[];
    
    // Format matches from user's perspective
    const matches = games.map((game) => {
      const isPlayer1 = game.player1_id === userId;
      const yourScore = isPlayer1 ? game.score1 : game.score2;
      const opponentScore = isPlayer1 ? game.score2 : game.score1;
      const winner = game.winner_id === userId ? 'you' : 'opponent';
      
      return {
        id: game.id,
        yourScore,
        opponentScore,
        winner,
        yourAvatar: userRow.avatar,
        opponentAvatar: opponentRow.avatar,
        mode: game.mode,
        playedAt: game.createdAt,
      };
    });
    
    reply.send({
      matches
    });
  } catch (error) {
    console.error("Error fetching match history:", error);
    reply.status(500).send({ error: "Failed to fetch match history" });
  }
});


const start = async () => {
  try {

    // Connect Kafka producer
    await kafkaProducerService.connectWithRetry();
    app.log.info("Kafka producer connected successfully");
    
    // Connect and start Kafka consumer with retry logic
    try {
      await kafkaConsumerService.connectWithRetry();
      
      // Small delay to ensure topics are fully initialized
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await kafkaConsumerService.subscribe();
      await kafkaConsumerService.startConsuming();
      app.log.info("Kafka consumer started successfully");
    } catch (error) {
      app.log.error("Failed to start Kafka consumer, service will continue without it:", error);
      // Continue service startup even if Kafka consumer fails
    }
    
    await app.listen({ port: 3005, host: "0.0.0.0" });
    app.log.info("🎮 Game Service running at http://0.0.0.0:3005");

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await kafkaConsumerService.disconnect();
  await kafkaProducerService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await kafkaConsumerService.disconnect();
  await kafkaProducerService.disconnect();
  process.exit(0);
});
