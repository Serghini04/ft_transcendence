import Fastify from "fastify";
import cors from "@fastify/cors";
import gameDB from "./plugins/game.db";
import gameSocket from "./plugins/game.socket";
import gameRoutes from "./routes/game.route";

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
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
});

// Attach database
app.decorate("db", gameDB);

// Attach socket.io
app.register(gameSocket);

// Register REST routes
app.register(gameRoutes, { prefix: "/api/v1/game" });

const start = async () => {
  try {
    await app.listen({ port: 3005, host: "0.0.0.0" });
    app.log.info("🎮 Game Service running at http://0.0.0.0:3005");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
