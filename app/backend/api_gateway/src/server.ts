import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import {authMiddleware} from "./middleware/auth.middleware";
import { chatService } from "./services/chat.service";
import { NotificationService } from "./services/notification.service";
import { setupSocketGateway } from "./utils/socket.gateway";
import { userAuthService } from "./services/userAuth.service";
import cookie from "@fastify/cookie"; 

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
    const allowedOrigins = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      app.log.warn(`CORS rejected: ${origin}`);
      cb(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
});

app.register(cookie, {
  secret: process.env.COOKIE_SECRET || "super-secret", 
  hook: "onRequest"
});


app.addHook("preHandler", authMiddleware);
app.register(chatService);
app.register(userAuthService);
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
