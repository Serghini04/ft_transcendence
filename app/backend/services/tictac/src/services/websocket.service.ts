import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { GameService } from '../services/game.service.js';
import { MatchmakingService } from '../services/matchmaking.service.js';

interface GameConnection {
  userId: string;
  gameId: string;
  socket: WebSocket;
}

export class WebSocketHandler {
  private static connections: Map<string, WebSocket> = new Map();
  private static gameConnections: Map<string, Set<string>> = new Map();

  static setup(fastify: FastifyInstance) {
    fastify.get('/ws', { websocket: true }, (socket, request) => {
      fastify.log.info('WebSocket connection established');

      socket.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(socket, message, fastify);
        } catch (error) {
          fastify.log.error({ err: error }, 'WebSocket message error');
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      socket.on('close', () => {
        this.handleDisconnect(socket);
        fastify.log.info('WebSocket connection closed');
      });

      socket.on('error', (error: Error) => {
        fastify.log.error({ err: error }, 'WebSocket error');
      });
    });
  }

  private static async handleMessage(socket: WebSocket, message: any, fastify: FastifyInstance) {
    const { type, data } = message;

    switch (type) {
      case 'register':
        this.handleRegister(socket, data);
        break;

      case 'join_game':
        this.handleJoinGame(socket, data);
        break;

      case 'make_move':
        await this.handleMove(socket, data, fastify);
        break;

      case 'join_matchmaking':
        await this.handleJoinMatchmaking(socket, data);
        break;

      case 'leave_matchmaking':
        this.handleLeaveMatchmaking(socket, data);
        break;

      case 'forfeit':
        await this.handleForfeit(socket, data, fastify);
        break;

      default:
        socket.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private static handleRegister(socket: WebSocket, data: { userId: string }) {
    const { userId } = data;
    this.connections.set(userId, socket);
    socket.send(JSON.stringify({ type: 'registered', userId }));
  }

  private static handleJoinGame(socket: WebSocket, data: { userId: string; gameId: string }) {
    const { userId, gameId } = data;

    if (!this.gameConnections.has(gameId)) {
      this.gameConnections.set(gameId, new Set());
    }

    this.gameConnections.get(gameId)!.add(userId);
    socket.send(JSON.stringify({ type: 'joined_game', gameId }));
  }

  private static async handleMove(socket: WebSocket, data: { gameId: string; playerId: string; position: number }, fastify: FastifyInstance) {
    const { gameId, playerId, position } = data;

    const result = GameService.makeMove(gameId, playerId, position);

    if (!result.success) {
      socket.send(JSON.stringify({
        type: 'move_error',
        error: result.error
      }));
      return;
    }

    // Broadcast move to all players in the game
    this.broadcastToGame(gameId, {
      type: 'game_update',
      game: result.game
    });

    // If game is finished, notify players
    if (result.game?.status === 'finished') {
      this.broadcastToGame(gameId, {
        type: 'game_finished',
        game: result.game
      });

      // Clean up game connections
      this.gameConnections.delete(gameId);
    }
  }

  private static async handleJoinMatchmaking(socket: WebSocket, data: { userId: string; username: string }) {
    const { userId, username } = data;

    // Use userId as socketId for simplicity
    const result = MatchmakingService.addToQueue(userId, username, userId);

    if (!result.success) {
      socket.send(JSON.stringify({
        type: 'matchmaking_error',
        error: result.message
      }));
      return;
    }

    if (result.match) {
      // Match found immediately
      const { game, opponent } = result.match;

      // Automatically add both players to the game connections
      if (!this.gameConnections.has(game.id)) {
        this.gameConnections.set(game.id, new Set());
      }
      this.gameConnections.get(game.id)!.add(userId);
      this.gameConnections.get(game.id)!.add(opponent.userId);

      // Notify both players
      this.sendToUser(userId, {
        type: 'match_found',
        game,
        opponent
      });

      this.sendToUser(opponent.userId, {
        type: 'match_found',
        game,
        opponent: { userId, username, rating: 1000 }
      });
    } else {
      socket.send(JSON.stringify({
        type: 'matchmaking_joined',
        message: result.message
      }));
    }
  }

  private static handleLeaveMatchmaking(socket: WebSocket, data: { userId: string }) {
    const { userId } = data;
    MatchmakingService.removeFromQueue(userId);

    socket.send(JSON.stringify({
      type: 'matchmaking_left',
      message: 'Left matchmaking queue'
    }));
  }

  private static async handleForfeit(socket: WebSocket, data: { gameId: string; playerId: string }, fastify: FastifyInstance) {
    const { gameId, playerId } = data;

    const result = GameService.forfeitGame(gameId, playerId);

    if (!result.success) {
      socket.send(JSON.stringify({
        type: 'forfeit_error',
        error: result.error
      }));
      return;
    }

    // Broadcast to game
    this.broadcastToGame(gameId, {
      type: 'game_finished',
      game: result.game,
      reason: 'forfeit'
    });

    // Clean up
    this.gameConnections.delete(gameId);
  }

  private static broadcastToGame(gameId: string, message: any) {
    const players = this.gameConnections.get(gameId);
    if (!players) return;

    for (const userId of players) {
      this.sendToUser(userId, message);
    }
  }

  private static sendToUser(userId: string, message: any) {
    const socket = this.connections.get(userId);
    if (socket && socket.readyState === 1) { // OPEN
      socket.send(JSON.stringify(message));
    }
  }

  private static handleDisconnect(socket: WebSocket) {
    // Find and remove connection
    for (const [userId, conn] of this.connections.entries()) {
      if (conn === socket) {
        this.connections.delete(userId);
        
        // Remove from matchmaking if in queue
        MatchmakingService.removeFromQueue(userId);
        
        // Remove from game connections
        for (const [gameId, players] of this.gameConnections.entries()) {
          players.delete(userId);
          if (players.size === 0) {
            this.gameConnections.delete(gameId);
          }
        }
        
        break;
      }
    }
  }

  static getStats() {
    return {
      connections: this.connections.size,
      activeGames: this.gameConnections.size
    };
  }
}
