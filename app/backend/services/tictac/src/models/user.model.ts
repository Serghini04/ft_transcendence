import db from '../config/database.js';
import type { DBUser, UserStats } from '../types/index.js';

export class UserModel {
  static create(id: string, username: string): DBUser {
    const stmt = db.prepare(`
      INSERT INTO users (id, username, rating, created_at)
      VALUES (?, ?, 1000, ?)
    `);
    
    const now = Date.now();
    stmt.run(id, username, now);
    
    return {
      id,
      username,
      rating: 1000,
      created_at: now
    };
  }

  static findById(id: string): DBUser | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as DBUser | undefined;
  }

  static findByUsername(username: string): DBUser | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as DBUser | undefined;
  }

  static updateRating(id: string, newRating: number): void {
    const stmt = db.prepare('UPDATE users SET rating = ? WHERE id = ?');
    stmt.run(newRating, id);
  }

  static getStats(userId: string): UserStats | null {
    const user = this.findById(userId);
    if (!user) return null;

    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN winner_id IS NOT NULL AND winner_id != ? THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN is_draw = 1 THEN 1 ELSE 0 END) as draws,
        MAX(created_at) as last_played
      FROM game_history
      WHERE player1_id = ? OR player2_id = ?
    `);

    const stats = stmt.get(userId, userId, userId, userId) as any;

    const totalGames = stats.total_games || 0;
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const draws = stats.draws || 0;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    return {
      userId: user.id,
      username: user.username,
      totalGames,
      wins,
      losses,
      draws,
      winRate: Math.round(winRate * 100) / 100,
      rating: user.rating,
      lastPlayed: stats.last_played || null
    };
  }

  static getLeaderboard(limit: number = 10): UserStats[] {
    const stmt = db.prepare(`
      SELECT id FROM users
      ORDER BY rating DESC
      LIMIT ?
    `);

    const users = stmt.all(limit) as { id: string }[];
    return users.map(u => this.getStats(u.id)).filter(Boolean) as UserStats[];
  }
}
