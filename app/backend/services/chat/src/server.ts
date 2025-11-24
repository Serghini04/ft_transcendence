import Fastify from "fastify";
import cors from "@fastify/cors";
import { db } from "./plugins/chat.db";
import chatRoutes from "./routes/chat.route";
import socketPlugin from "./plugins/socket";


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

app.register(cors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-user-id"]
});

app.decorate("db", db);
app.register(socketPlugin);
app.register(chatRoutes, { prefix: "/api/v1/chat"});

const start = async () => {
  try {
    await app.listen({ port: 3003, host: '0.0.0.0' });
    app.log.info("🚀 Chat Service running at http://0.0.0.0:3003");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
