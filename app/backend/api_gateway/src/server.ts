import Fastify from "fastify";
import cors from "@fastify/cors";
import authMiddleware from "./middleware/auth.middleware";
import { chatService } from "./services/chat.service";
import { setupSocketGateway } from "./utils/socket.gateway";
import { userAuthService } from "./services/userAuth.service";

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
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-user-id"]
});

app.addHook("onRequest", authMiddleware);
app.register(chatService);
app.register(userAuthService);

const start = async () => {
  try {
    await app.listen({ port: 8080, host:"localhost"});
    await setupSocketGateway(app);
    app.log.info("🚀 API Gateway running at http://localhost:8080");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
