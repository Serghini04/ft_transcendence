import { FastifyInstance } from "fastify";
import { 
  getLeaderboard, 
  getPlayerStats, 
  getPlayerGames,
  getTicTacToeLeaderboard,
  getTicTacToePlayerStats
} from "../db";

async function fetchUserInfo(userId: string, token: string) {
  try {
    const response = await fetch(`http://user_auth:3004/api/v1/auth/profile/getProfileUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: parseInt(userId) }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.user?.name || `User${userId}`;
    } else {
      console.error(`Failed to fetch user ${userId}: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to fetch user info for ${userId}:`, error);
  }
  return `User${userId}`;
}

export async function leaderboardRoutes(app: FastifyInstance) {
  // Get top players
  app.get("/api/v1/leaderboard", async (request, reply) => {
    const { limit = 100 } = request.query as { limit?: number };
    const token = request.headers.authorization?.split(" ")[1];
    
    const leaderboard = getLeaderboard(Number(limit));
    
    // Fetch usernames for all players
    const leaderboardWithUsernames = await Promise.all(
      leaderboard.map(async (player: any) => {
        const username = token ? await fetchUserInfo(player.user_id, token) : `User${player.user_id}`;
        return {
          ...player,
          username,
        };
      })
    );
    
    return { leaderboard: leaderboardWithUsernames };
  });

  // Get player stats
  app.get("/api/v1/leaderboard/player/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    request.log.info(` ---------> Fetching stats for user: ${userId}`);
    const stats = getPlayerStats(userId);
    
    if (!stats) {
      return reply.status(404).send({ error: "Player not found" });
    }
    
    return stats;
  });

  // Get player's game history
  app.get("/api/v1/leaderboard/player/:userId/games", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { limit = 5 } = request.query as { limit?: number };
    
    const games = getPlayerGames(userId, Number(limit));
    return { games, count: games.length };
  });

  // ==================== TicTacToe Routes ====================

  // Get TicTacToe leaderboard
  app.get("/api/v1/leaderboard/tictactoe", async (request, reply) => {
    const { limit = 100 } = request.query as { limit?: number };
    const token = request.headers.authorization?.split(" ")[1];
    
    const leaderboard = getTicTacToeLeaderboard(Number(limit));
    
    // Fetch usernames for all players
    const leaderboardWithUsernames = await Promise.all(
      leaderboard.map(async (player: any) => {
        const username = token ? await fetchUserInfo(player.user_id, token) : `User${player.user_id}`;
        return {
          ...player,
          username,
        };
      })
    );
    
    return { leaderboard: leaderboardWithUsernames };
  });

  // Get TicTacToe player stats
  app.get("/api/v1/leaderboard/tictactoe/player/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    request.log.info(` ---------> Fetching TicTacToe stats for user: ${userId}`);
    const stats = getTicTacToePlayerStats(userId);
    
    if (!stats) {
      return reply.status(404).send({ error: "Player not found" });
    }
    
    return stats;
  });
}