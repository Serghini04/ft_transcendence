import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchmakingService } from '../services/matchmaking.service.js';

export async function matchmakingRoutes(fastify: FastifyInstance) {
  

  fastify.post('/matchmaking/join', async (request: FastifyRequest<{
    Body: { userId: string; username: string; socketId: string }
  }>, reply: FastifyReply) => {
    const { userId, username, socketId } = request.body;

    if (!userId || !username || !socketId) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    try {
      const result = MatchmakingService.addToQueue(userId, username, socketId);

      if (!result.success) {
        return reply.code(400).send({ error: result.message });
      }

      return reply.code(200).send({
        message: result.message,
        match: result.match
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to join matchmaking' });
    }
  });

  fastify.post('/matchmaking/leave', async (request: FastifyRequest<{
    Body: { userId: string }
  }>, reply: FastifyReply) => {
    const { userId } = request.body;

    if (!userId) {
      return reply.code(400).send({ error: 'User ID required' });
    }

    try {
      const removed = MatchmakingService.removeFromQueue(userId);

      return reply.code(200).send({
        message: removed ? 'Removed from queue' : 'Not in queue',
        removed
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to leave matchmaking' });
    }
  });

  fastify.get('/matchmaking/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const status = MatchmakingService.getQueueStatus();
      return reply.code(200).send({ status });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get queue status' });
    }
  });

  fastify.get('/matchmaking/check/:userId', async (request: FastifyRequest<{
    Params: { userId: string }
  }>, reply: FastifyReply) => {
    const { userId } = request.params;

    try {
      const inQueue = MatchmakingService.isInQueue(userId);
      const player = MatchmakingService.getFromQueue(userId);

      return reply.code(200).send({
        inQueue,
        player: player || null
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to check queue status' });
    }
  });
}
