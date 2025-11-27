
import authMiddleware from "../middleware/auth.js";
import {
  getUserGames,
  getUserStats,
  getRecentGames,
} from "../controllers/game.controller.js";

export default async function gameRoutes(fastify, opts) {
  
  const auth = async (request, reply) => {
    try {
      await authMiddleware(request, reply);
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  };

  fastify.get(
    "/user/:userId",
    { preHandler: auth },
    async (request, reply) => {
      return getUserGames(request, reply);
    }
  );

  fastify.get(
    "/stats/:userId",
    { preHandler: auth },
    async (request, reply) => {
      return getUserStats(request, reply);
    }
  );

  fastify.get(
    "/recent",
    { preHandler: auth },
    async (request, reply) => {
      return getRecentGames(request, reply);
    }
  );
}
