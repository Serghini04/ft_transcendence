import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GameModel } from '../models/game.model.js';
import { GameService } from '../services/game.service.js';

export async function gameRoutes(fastify: FastifyInstance) {
  
  fastify.get('/games/:gameId', async (request: FastifyRequest<{
    Params: { gameId: string }
  }>, reply: FastifyReply) => {
    const { gameId } = request.params;

    try {
      const game = GameModel.findById(gameId);

      if (!game) {
        return reply.code(404).send({ error: 'Game not found' });
      }

      return reply.code(200).send({ game });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get game' });
    }
  });

  fastify.post('/games/:gameId/move', async (request: FastifyRequest<{
    Params: { gameId: string };
    Body: { playerId: string; position: number }
  }>, reply: FastifyReply) => {
    const { gameId } = request.params;
    const { playerId, position } = request.body;

    if (position === undefined || position < 0 || position > 8) {
      return reply.code(400).send({ error: 'Invalid position' });
    }

    if (!playerId) {
      return reply.code(400).send({ error: 'Player ID required' });
    }

    try {
      const result = await GameService.makeMove(gameId, playerId, position);

      if (!result.success) {
        return reply.code(400).send({ error: result.error });
      }

      return reply.code(200).send({ game: result.game });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to make move' });
    }
  });

  fastify.post('/games/:gameId/forfeit', async (request: FastifyRequest<{
    Params: { gameId: string };
    Body: { playerId: string }
  }>, reply: FastifyReply) => {
    const { gameId } = request.params;
    const { playerId } = request.body;

    if (!playerId) {
      return reply.code(400).send({ error: 'Player ID required' });
    }

    try {
      const result = await GameService.forfeitGame(gameId, playerId);

      if (!result.success) {
        return reply.code(400).send({ error: result.error });
      }

      return reply.code(200).send({ game: result.game });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to forfeit game' });
    }
  });

  fastify.get('/games/player/:playerId/active', async (request: FastifyRequest<{
    Params: { playerId: string }
  }>, reply: FastifyReply) => {
    const { playerId } = request.params;

    try {
      const game = GameModel.findActiveByPlayer(playerId);

      // Return 200 with null game instead of 404 to avoid console errors
      // No active game is a valid state, not an error
      if (!game) {
        return reply.code(200).send({ game: null });
      }

      return reply.code(200).send({ game });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get active game' });
    }
  });

  fastify.get('/games/player/:playerId', async (request: FastifyRequest<{
    Params: { playerId: string };
    Querystring: { limit?: string }
  }>, reply: FastifyReply) => {
    const { playerId } = request.params;
    const limit = parseInt(request.query.limit || '20');

    try {
      const games = GameModel.getPlayerGames(playerId, limit);
      return reply.code(200).send({ games });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get games' });
    }
  });
}
