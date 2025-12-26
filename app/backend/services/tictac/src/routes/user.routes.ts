import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserModel } from '../models/user.model.js';
import { GameHistoryModel } from '../models/history.model.js';
import { nanoid } from 'nanoid';

export async function userRoutes(fastify: FastifyInstance) {
  // Create or get user
  fastify.post('/users', async (request: FastifyRequest<{
    Body: { username: string }
  }>, reply: FastifyReply) => {
    const { username } = request.body;

    if (!username || username.trim().length < 3) {
      return reply.code(400).send({ error: 'Username must be at least 3 characters' });
    }

    try {
      // Check if user exists
      let user = UserModel.findByUsername(username);

      if (!user) {
        // Create new user
        const userId = nanoid();
        user = UserModel.create(userId, username);
      }

      return reply.code(200).send({ user });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create/get user' });
    }
  });

  // Get user stats
  fastify.get('/users/:userId/stats', async (request: FastifyRequest<{
    Params: { userId: string }
  }>, reply: FastifyReply) => {
    const { userId } = request.params;

    try {
      const stats = UserModel.getStats(userId);

      if (!stats) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.code(200).send({ stats });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get user stats' });
    }
  });

  // Get user game history
  fastify.get('/users/:userId/history', async (request: FastifyRequest<{
    Params: { userId: string };
    Querystring: { limit?: string }
  }>, reply: FastifyReply) => {
    const { userId } = request.params;
    const limit = parseInt(request.query.limit || '20');

    try {
      const history = GameHistoryModel.getPlayerHistory(userId, limit);
      return reply.code(200).send({ history });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get game history' });
    }
  });

  // Get leaderboard
  fastify.get('/users/leaderboard', async (request: FastifyRequest<{
    Querystring: { limit?: string }
  }>, reply: FastifyReply) => {
    const limit = parseInt(request.query.limit || '10');

    try {
      const leaderboard = UserModel.getLeaderboard(limit);
      return reply.code(200).send({ leaderboard });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get leaderboard' });
    }
  });
}
