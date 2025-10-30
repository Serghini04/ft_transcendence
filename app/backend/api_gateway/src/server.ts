import Fastify from "fastify";
import cors from "@fastify/cors";
import authMiddleware from "./middleware/auth.middleware";
import { chatService } from "./services/chat.service";
import { setupSocketGateway } from "./socket.gateway";

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss" },
    },
  },
});

app.register(cors, {
  origin: "http://localhost:5173",
  credentials: true,
});

app.addHook("onRequest", authMiddleware);

app.register(chatService);

const start = async () => {
  try {
    await app.listen({ port: 8080 });
    await setupSocketGateway(app);
    app.log.info("🚀 API Gateway running at http://localhost:8080");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
