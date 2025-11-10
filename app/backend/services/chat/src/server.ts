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
  origin: [
    "https://orange-spork-gwpjvgpgxjwfvxx9-5173.app.github.dev",
    "https://orange-spork-gwpjvgpgxjwfvxx9-3000.app.github.dev",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-user-id"]
});

app.decorate("db", db);
app.register(socketPlugin);
app.register(chatRoutes, { prefix: "/api/v1/chat"});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    app.log.info("🚀 Chat Service running at http://0.0.0.0:3000");
    app.log.info("🌐 Public URL: https://orange-spork-gwpjvgpgxjwfvxx9-3000.app.github.dev");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
