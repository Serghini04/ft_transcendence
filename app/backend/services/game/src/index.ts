import Fastify from "fastify";
import cors from "@fastify/cors";
import {db} from "./plugins/game.db";
import gameSocket from "./plugins/game.socket";

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

// Register REST routes
// app.register(gameRoutes, { prefix: "/api/v1/game/user" });

app.get("/api/v1/game/user/:userId", async (request, reply) => {
  const { userId } = request.params as { userId: string };
  
  // db.prepare(`INSERT INTO users (id, name, avatar) VALUES (?, ?, ?)`)
  // .run(userId, "souaouri", "");

  const row = db.prepare("SELECT id, name, avatar FROM users WHERE id = ?").get(userId);

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
