import db from '../config/database.js';
import type { DBGameHistory, GameHistory, GameState } from '../types/index.js';

export class GameHistoryModel {
  static create(gameState: GameState, moves: number, duration: number): GameHistory {
    const stmt = db.prepare(`
      INSERT INTO game_history (
        game_id, player1_id, player2_id, winner_id, is_draw, moves, duration, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const isDraw = gameState.winner === null && gameState.status === 'finished' ? 1 : 0;
    const now = Date.now();
    
    const result = stmt.run(
      gameState.id,
      gameState.player1Id,
      gameState.player2Id,
      gameState.winner,
      isDraw,
      moves,
      duration,
      now
    );
    
    return {
      id: Number(result.lastInsertRowid),
      gameId: gameState.id,
      player1Id: gameState.player1Id,
      player2Id: gameState.player2Id,
      winnerId: gameState.winner,
      isDraw: isDraw === 1,
      moves,
      duration,
      createdAt: now
    };
  }

  static findByGameId(gameId: string): GameHistory | undefined {
    const stmt = db.prepare('SELECT * FROM game_history WHERE game_id = ?');
    const history = stmt.get(gameId) as DBGameHistory | undefined;
    
    if (!history) return undefined;
    
    return this.dbHistoryToGameHistory(history);
  }

  static getPlayerHistory(playerId: string, limit: number = 20): GameHistory[] {
    const stmt = db.prepare(`
      SELECT * FROM game_history 
      WHERE player1_id = ? OR player2_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    const histories = stmt.all(playerId, playerId, limit) as DBGameHistory[];
    return histories.map(h => this.dbHistoryToGameHistory(h));
  }

  static getRecentGames(limit: number = 10): GameHistory[] {
    const stmt = db.prepare(`
      SELECT * FROM game_history 
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    const histories = stmt.all(limit) as DBGameHistory[];
    return histories.map(h => this.dbHistoryToGameHistory(h));
  }

  private static dbHistoryToGameHistory(history: DBGameHistory): GameHistory {
    return {
      id: history.id,
      gameId: history.game_id,
      player1Id: history.player1_id,
      player2Id: history.player2_id,
      winnerId: history.winner_id,
      isDraw: history.is_draw === 1,
      moves: history.moves,
      duration: history.duration,
      createdAt: history.created_at
    };
  }
}
