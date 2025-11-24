import type { MatchmakingPlayer, GameState } from '../types/index.js';
import { GameService } from './game.service.js';
import { UserModel } from '../models/user.model.js';

export class MatchmakingService {
  private static queue: Map<string, MatchmakingPlayer> = new Map();
  private static readonly SKILL_RANGE = parseInt(process.env.SKILL_RANGE || '100');
  private static readonly TIMEOUT = parseInt(process.env.MATCHMAKING_TIMEOUT || '60000');

  /**
   * Add a player to the matchmaking queue
   */
  static addToQueue(userId: string, username: string, socketId: string): {
    success: boolean;
    message: string;
    match?: { game: GameState; opponent: MatchmakingPlayer };
  } {
    // Check if player is already in queue
    if (this.queue.has(userId)) {
      return { success: false, message: 'Already in matchmaking queue' };
    }

    // Get player rating
    const user = UserModel.findById(userId);
    const rating = user?.rating || 1000;

    const player: MatchmakingPlayer = {
      userId,
      username,
      rating,
      socketId,
      joinedAt: Date.now()
    };

    // Try to find a match immediately
    const opponent = this.findMatch(player);

    if (opponent) {
      // Remove opponent from queue
      this.queue.delete(opponent.userId);

      // Create game
      const game = GameService.createGame(player.userId, opponent.userId);

      return {
        success: true,
        message: 'Match found!',
        match: { game, opponent }
      };
    }

    // No match found, add to queue
    this.queue.set(userId, player);

    // Set timeout to remove from queue
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

  /**
   * Remove a player from the matchmaking queue
   */
  static removeFromQueue(userId: string): boolean {
    return this.queue.delete(userId);
  }

  /**
   * Find a suitable match for a player
   */
  private static findMatch(player: MatchmakingPlayer): MatchmakingPlayer | null {
    let bestMatch: MatchmakingPlayer | null = null;
    let smallestDiff = Infinity;

    for (const [userId, opponent] of this.queue.entries()) {
      if (userId === player.userId) continue;

      const ratingDiff = Math.abs(player.rating - opponent.rating);

      // Check if opponent is within skill range
      if (ratingDiff <= this.SKILL_RANGE && ratingDiff < smallestDiff) {
        bestMatch = opponent;
        smallestDiff = ratingDiff;
      }
    }

    // If no match within skill range after some time, expand search
    if (!bestMatch) {
      // Find any available player who's been waiting long enough
      for (const [userId, opponent] of this.queue.entries()) {
        if (userId === player.userId) continue;
        
        const waitTime = Date.now() - opponent.joinedAt;
        if (waitTime > 10000) { // 10 seconds
          bestMatch = opponent;
          break;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Get current queue status
   */
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

  /**
   * Check if a player is in queue
   */
  static isInQueue(userId: string): boolean {
    return this.queue.has(userId);
  }

  /**
   * Get player from queue
   */
  static getFromQueue(userId: string): MatchmakingPlayer | undefined {
    return this.queue.get(userId);
  }

  /**
   * Clear all expired entries from queue
   */
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

  /**
   * Try to match all players in queue
   */
  static processQueue(): Array<{ game: GameState; player1: MatchmakingPlayer; player2: MatchmakingPlayer }> {
    const matches: Array<{ game: GameState; player1: MatchmakingPlayer; player2: MatchmakingPlayer }> = [];
    const processed = new Set<string>();

    for (const [userId, player] of this.queue.entries()) {
      if (processed.has(userId)) continue;

      const opponent = this.findMatch(player);
      if (opponent && !processed.has(opponent.userId)) {
        // Create game
        const game = GameService.createGame(player.userId, opponent.userId);

        matches.push({
          game,
          player1: player,
          player2: opponent
        });

        // Mark as processed
        processed.add(userId);
        processed.add(opponent.userId);

        // Remove from queue
        this.queue.delete(userId);
        this.queue.delete(opponent.userId);
      }
    }

    return matches;
  }
}
