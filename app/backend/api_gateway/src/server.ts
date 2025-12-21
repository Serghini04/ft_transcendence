import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import {authMiddleware} from "./middleware/auth.middleware";
import { chatService } from "./services/chat.service";
import { setupSocketGateway } from "./utils/socket.gateway";
import { userAuthService } from "./services/userAuth.service";
import cookie from "@fastify/cookie"; 
import { gameService } from "./services/game.service";
import { NotificationService } from "./services/notification.service";
import { tictacService } from "./services/tictac.service";

dotenv.config();

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss" },
    },
  },
});

app.log.info({
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasJwtRefresh: !!process.env.JWT_REFRESH,
  hasCookieSecret: !!process.env.COOKIE_SECRET,
}, "🔐 Environment variables loaded");

app.register(cors, {
  origin: (origin, cb) => {
    // Allow all origins in development
    if (!origin) {
      cb(null, true);
    } else {
      cb(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400, // Cache preflight for 24 hours
});

app.register(cookie, {
  secret: process.env.COOKIE_SECRET || "super-secret", 
  hook: "onRequest"
});


app.addHook("preHandler", authMiddleware);
app.register(tictacService); // Register first to handle /api/* (non-v1) routes
app.register(chatService);
app.register(userAuthService);
app.register(gameService);
app.register(NotificationService);
const start = async () => {
  try {
    await setupSocketGateway(app);
    await app.listen({ port: 8080, host: "0.0.0.0" });
    app.log.info("API Gateway running at http://localhost:8080");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
