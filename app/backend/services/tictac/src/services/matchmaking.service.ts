import type { MatchmakingPlayer, GameState } from '../types/index.js';
import { GameService } from './game.service.js';
import { UserModel } from '../models/user.model.js';

export class MatchmakingService {
  private static queue: Map<string, MatchmakingPlayer> = new Map();
  private static readonly SKILL_RANGE = parseInt(process.env.SKILL_RANGE || '100');
  private static readonly TIMEOUT = parseInt(process.env.MATCHMAKING_TIMEOUT || '60000');

  static addToQueue(userId: string, username: string, socketId: string): {
    success: boolean;
    message: string;
    match?: { game: GameState; opponent: MatchmakingPlayer };
  } {
    
    if (this.queue.has(userId)) {
      return { success: false, message: 'Already in matchmaking queue' };
    }

    
    const user = UserModel.findById(userId);
    const rating = user?.rating || 1000;

    const player: MatchmakingPlayer = {
      userId,
      username,
      rating,
      socketId,
      joinedAt: Date.now()
    };

    const opponent = this.findMatch(player);

    if (opponent) {
      this.queue.delete(opponent.userId);

      const game = GameService.createGame(player.userId, opponent.userId);

      return {
        success: true,
        message: 'Match found!',
        match: { game, opponent }
      };
    }

    this.queue.set(userId, player);

    setTimeout(() => {
      if (this.queue.has(userId)) {
        this.queue.delete(userId);
      }
    }, this.TIMEOUT);

    return {
      success: true,
      message: 'Added to matchmaking queue'
    };
  }

  static removeFromQueue(userId: string): boolean {
    return this.queue.delete(userId);
  }

  private static findMatch(player: MatchmakingPlayer): MatchmakingPlayer | null {
    let bestMatch: MatchmakingPlayer | null = null;
    let smallestDiff = Infinity;

    for (const [userId, opponent] of this.queue.entries()) {
      if (userId === player.userId) continue;

      const ratingDiff = Math.abs(player.rating - opponent.rating);

      if (ratingDiff <= this.SKILL_RANGE && ratingDiff < smallestDiff) {
        bestMatch = opponent;
        smallestDiff = ratingDiff;
      }
    }

    if (!bestMatch) {
      for (const [userId, opponent] of this.queue.entries()) {
        if (userId === player.userId) continue;
        
        const waitTime = Date.now() - opponent.joinedAt;
        if (waitTime > 10000) { 
          bestMatch = opponent;
          break;
        }
      }
    }

    return bestMatch;
  }

  static getQueueStatus(): {
    queueSize: number;
    players: Array<{ userId: string; username: string; rating: number; waitTime: number }>;
  } {
    const now = Date.now();
    const players = Array.from(this.queue.values()).map(p => ({
      userId: p.userId,
      username: p.username,
      rating: p.rating,
      waitTime: now - p.joinedAt
    }));

    return {
      queueSize: this.queue.size,
      players
    };
  }

  static isInQueue(userId: string): boolean {
    return this.queue.has(userId);
  }

  static getFromQueue(userId: string): MatchmakingPlayer | undefined {
    return this.queue.get(userId);
  }

  static clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [userId, player] of this.queue.entries()) {
      if (now - player.joinedAt > this.TIMEOUT) {
        this.queue.delete(userId);
        cleared++;
      }
    }

    return cleared;
  }

  static processQueue(): Array<{ game: GameState; player1: MatchmakingPlayer; player2: MatchmakingPlayer }> {
    const matches: Array<{ game: GameState; player1: MatchmakingPlayer; player2: MatchmakingPlayer }> = [];
    const processed = new Set<string>();

    for (const [userId, player] of this.queue.entries()) {
      if (processed.has(userId)) continue;

      const opponent = this.findMatch(player);
      if (opponent && !processed.has(opponent.userId)) {
        const game = GameService.createGame(player.userId, opponent.userId);

        matches.push({
          game,
          player1: player,
          player2: opponent
        });

        processed.add(userId);
        processed.add(opponent.userId);

        this.queue.delete(userId);
        this.queue.delete(opponent.userId);
      }
    }

    return matches;
  }
}
