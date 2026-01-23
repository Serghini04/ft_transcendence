import Fastify from "fastify";
import cors from "@fastify/cors";
import { kafkaConsumerService } from "./kafka/consumer";
import { leaderboardRoutes } from "./routes/index";

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

// CORS
app.register(cors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Register routes
app.register(leaderboardRoutes);

const start = async () => {
  try {
    // Start HTTP server
    await app.listen({ port: 3016, host: "0.0.0.0" });
    app.log.info("🏆 Leaderboard Service running at http://0.0.0.0:3016");

    // Start Kafka consumer (non-blocking)
    kafkaConsumerService.startConsuming().catch((err) => {
      app.log.error("Failed to start Kafka consumer:", err);
      app.log.warn("⚠️ Leaderboard service running without Kafka - will retry connection in background");
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await kafkaConsumerService.disconnect();
  await app.close();
  process.exit(0);
});