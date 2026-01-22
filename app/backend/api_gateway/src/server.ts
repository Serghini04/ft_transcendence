import Fastify from "fastify";
import cors from "@fastify/cors";
import {authMiddleware} from "./middleware/auth.middleware";
import { chatService } from "./services/chat.service";
import { setupSocketGateway } from "./utils/socket.gateway";
import { userAuthService } from "./services/userAuth.service";
import cookie from "@fastify/cookie"; 
import { gameService } from "./services/game.service";
import { NotificationService } from "./services/notification.service";
import { tictacService } from "./services/tictac.service";
import { leaderboardService } from "./services/leaderboard.service";
import { vaultClient } from "./utils/vault.client";
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

async function initializeApp() {
  try {
    secrets = await vaultClient.loadSecrets();
    
    app.log.info({
      hasJwtSecret: !!secrets.JWT_SECRET,
      hasJwtRefresh: !!secrets.JWT_REFRESH,
      hasCookieSecret: !!secrets.COOKIE_SECRET,
      hasInternalSecret: !!secrets.INTERNAL_SECRET_KEY,
    }, "Secrets loaded from Vault");

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
  } catch (error: any) {
    app.log.error('Failed to initialize with Vault secrets:', error.message);
  }
}


app.addHook("preHandler", authMiddleware);
app.register(userAuthService);
app.register(tictacService);
app.register(chatService);
app.register(gameService);
app.register(NotificationService);
app.register(leaderboardService);
const start = async () => {
  try {

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

export { secrets };
