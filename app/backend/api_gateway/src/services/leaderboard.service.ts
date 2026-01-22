import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

export async function leaderboardService(app: FastifyInstance) {
  app.log.info("Registering Leaderboard Service proxy...");

  app.register(proxy, {
    upstream: process.env.LEADERBOARD_SERVICE_URL || "http://leaderboard-service:3016",
    prefix: "/api/v1/leaderboard",
    rewritePrefix: "/api/v1/leaderboard",
    
    preHandler: async (req, _res) => {
        req.headers["x-user-id"] = String(req.user?.id);
    },
  });
}