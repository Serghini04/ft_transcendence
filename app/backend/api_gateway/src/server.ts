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
import { vaultClient } from "./utils/vault.client";

dotenv.config();

// Global variable to store secrets
let secrets: any = null;

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss" },
    },
  },
});

// Initialize app with secrets from Vault
async function initializeApp() {
  try {
    // Load secrets from Vault
    secrets = await vaultClient.loadSecrets();
    
    app.log.info({
      hasJwtSecret: !!secrets.JWT_SECRET,
      hasJwtRefresh: !!secrets.JWT_REFRESH,
      hasCookieSecret: !!secrets.COOKIE_SECRET,
      hasInternalSecret: !!secrets.INTERNAL_SECRET_KEY,
    }, "🔐 Secrets loaded from Vault");

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
      secret: secrets.COOKIE_SECRET, 
      hook: "onRequest"
    });
  } catch (error: any) {
    app.log.error('❌ Failed to initialize with Vault secrets:', error.message);
    app.log.warn('⚠️  Falling back to environment variables');
    
    // Fallback to environment variables
    // secrets = {
    //   JWT_SECRET: process.env.JWT_SECRET || '',
    //   JWT_REFRESH: process.env.JWT_REFRESH || '',
    //   COOKIE_SECRET: process.env.COOKIE_SECRET || 'super-secret',
    //   INTERNAL_SECRET_KEY: process.env.INTERNAL_SECRET_KEY || '',
    // };

    app.register(cors, {
      origin: (origin, cb) => {
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
      maxAge: 86400,
    });

    app.register(cookie, {
      secret: secrets.COOKIE_SECRET, 
      hook: "onRequest"
    });
  }
}


app.addHook("preHandler", authMiddleware);
app.register(tictacService); // Register first to handle /api/* (non-v1) routes
app.register(chatService);
app.register(userAuthService);
app.register(gameService);
app.register(NotificationService);

const start = async () => {
  try {
    // Initialize app with Vault secrets first
    await initializeApp();
    
    await setupSocketGateway(app);
    await app.listen({ port: 8080, host: "0.0.0.0" });
    app.log.info("API Gateway running at http://localhost:8080");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// Export secrets for use in other modules
export { secrets };
