import Fastify from "fastify";
import messageRoutes from "./routes/chat.route";
import { db } from "./db/chat.db";
import chatRoutes from "./routes/chat.route";

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

app.decorate("db", db);
app.register(chatRoutes, { prefix: "/api/v1/chat"});

const start = async () => {
  try {
    await app.listen({ port: 3000 });
    app.log.info("🚀 Chat Service running at http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
