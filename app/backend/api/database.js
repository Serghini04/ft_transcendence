import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export const initDatabase = () => {
  try {
    const dbPath = path.join(__dirname, '../../data/game.db');
    const dbDir = path.dirname(dbPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize SQLite database
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    console.log(`✅ SQLite database connected: ${dbPath}`);
    
    // Create tables
    createTables();
    
    return db;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

const createTables = () => {
  // Games table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'paddle',
      mode TEXT NOT NULL DEFAULT 'online',
      player1_id TEXT NOT NULL,
      player1_name TEXT NOT NULL,
      player1_avatar TEXT,
      player1_score INTEGER DEFAULT 0,
      player2_id TEXT NOT NULL,
      player2_name TEXT NOT NULL,
      player2_avatar TEXT,
      player2_score INTEGER DEFAULT 0,
      winner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
    CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
    CREATE INDEX IF NOT EXISTS idx_games_winner ON games(winner_id);
    CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at);
  `);
  // Users table (for leaderboard and profile cache)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      level INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
    CREATE INDEX IF NOT EXISTS idx_users_updated ON users(updated_at);
  `);

  console.log('Database tables created');
};

  

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    console.log('Database connection closed');
  }
};

// Game operations
export const saveGameResult = (gameData) => {
  const stmt = db.prepare(`
    INSERT INTO games (
      game_id, mode, 
      player1_id, player1_name, player1_avatar, player1_score,
      player2_id, player2_name, player2_avatar, player2_score,
      winner_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    gameData.gameId,
    gameData.mode || 'online',
    gameData.player1.id,
    gameData.player1.name,
    gameData.player1.avatar || null,
    gameData.player1.score,
    gameData.player2.id,
    gameData.player2.name,
    gameData.player2.avatar || null,
    gameData.player2.score,
    gameData.winner.id,
    gameData.createdAt || Date.now()
  );

  return result.lastInsertRowid;
};

export const getUserGames = (userId, limit = 10) => {
  const stmt = db.prepare(`
    SELECT * FROM games 
    WHERE player1_id = ? OR player2_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return stmt.all(userId, userId, limit);
};

export const getUserStats = (userId) => {
  const games = db.prepare(`
    SELECT * FROM games 
    WHERE player1_id = ? OR player2_id = ?
  `).all(userId, userId);

  const stats = {
    totalGames: games.length,
    wins: games.filter(g => g.winner_id === userId).length,
    losses: games.filter(g => g.winner_id && g.winner_id !== userId).length,
    level: stats.totalGames > 0 ? (stats.wins / stats.totalGames * 10) : 0 // float between 0 and 10
  };

  return stats;
};

export const getRecentGames = (limit = 10) => {
  const stmt = db.prepare(`
    SELECT * FROM games 
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return stmt.all(limit);
};

// Users operations
export const upsertUser = (user) => {
  const stmt = db.prepare(`
    INSERT INTO users (id, name, avatar, level, created_at, updated_at)
    VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      avatar = excluded.avatar,
      updated_at = CURRENT_TIMESTAMP
  `);

  return stmt.run(user.id, user.name, user.avatar);
};

export const updateUserLevel = (userId, level) => {
  const stmt = db.prepare(`
    UPDATE users SET level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  return stmt.run(level, userId);
};

export const getLeaderboard = (limit = 10) => {
  const stmt = db.prepare(`
    SELECT id as user_id, name, avatar, level FROM users
    ORDER BY level DESC
    LIMIT ?
  `);

  return stmt.all(limit);
};