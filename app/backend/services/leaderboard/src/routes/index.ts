import { FastifyInstance } from "fastify";
import { getLeaderboard, getPlayerStats, getPlayerGames } from "../db";

export async function leaderboardRoutes(app: FastifyInstance) {
  // Get top players
  app.get("/api/v1/leaderboard", async (request, reply) => {
    const { limit = 100 } = request.query as { limit?: number };
    const leaderboard = getLeaderboard(Number(limit));
    return { leaderboard };
  });

  // Get player stats
  app.get("/api/v1/leaderboard/player/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const stats = getPlayerStats(userId);
    
    if (!stats) {
      return reply.status(404).send({ error: "Player not found" });
    }
    
    return stats;
  });

  // Get player's game history
  app.get("/api/v1/leaderboard/player/:userId/games", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { limit = 20 } = request.query as { limit?: number };
    
    const games = getPlayerGames(userId, Number(limit));
    return { games, count: games.length };
  });
}