import db from '../config/database.js';
import type { DBGame, GameState } from '../types/index.js';

export class GameModel {
  static create(id: string, player1Id: string, player2Id: string): GameState {
    const board = Array(9).fill('');
    const now = Date.now();
    
    const stmt = db.prepare(`
      INSERT INTO games (id, player1_id, player2_id, board, current_turn, status, started_at)
      VALUES (?, ?, ?, ?, 'X', 'active', ?)
    `);
    
    stmt.run(id, player1Id, player2Id, JSON.stringify(board), now);
    
    return {
      id,
      player1Id,
      player2Id,
      board: board as ('X' | 'O' | '')[],
      currentTurn: 'X',
      status: 'active',
      winner: null,
      winnerSymbol: null,
      startedAt: now,
      finishedAt: null
    };
  }

  static findById(id: string): GameState | undefined {
    const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
    const game = stmt.get(id) as DBGame | undefined;
    
    if (!game) return undefined;
    
    return this.dbGameToGameState(game);
  }

  static findActiveByPlayer(playerId: string): GameState | undefined {
    const stmt = db.prepare(`
      SELECT * FROM games 
      WHERE (player1_id = ? OR player2_id = ?) 
      AND status = 'active'
      LIMIT 1
    `);
    
    const game = stmt.get(playerId, playerId) as DBGame | undefined;
    
    if (!game) return undefined;
    
    return this.dbGameToGameState(game);
  }

  static update(gameState: GameState): void {
    const stmt = db.prepare(`
      UPDATE games 
      SET board = ?, current_turn = ?, status = ?, winner_id = ?, winner_symbol = ?, finished_at = ?
      WHERE id = ?
    `);
    
    stmt.run(
      JSON.stringify(gameState.board),
      gameState.currentTurn,
      gameState.status,
      gameState.winner,
      gameState.winnerSymbol,
      gameState.finishedAt,
      gameState.id
    );
  }

  static getPlayerGames(playerId: string, limit: number = 20): GameState[] {
    const stmt = db.prepare(`
      SELECT * FROM games 
      WHERE player1_id = ? OR player2_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `);
    
    const games = stmt.all(playerId, playerId, limit) as DBGame[];
    return games.map(g => this.dbGameToGameState(g));
  }

  private static dbGameToGameState(game: DBGame): GameState {
    return {
      id: game.id,
      player1Id: game.player1_id,
      player2Id: game.player2_id,
      board: JSON.parse(game.board) as ('X' | 'O' | '')[],
      currentTurn: game.current_turn as 'X' | 'O',
      status: game.status as 'waiting' | 'active' | 'finished',
      winner: game.winner_id,
      winnerSymbol: game.winner_symbol as 'X' | 'O' | null,
      startedAt: game.started_at,
      finishedAt: game.finished_at
    };
  }
}
