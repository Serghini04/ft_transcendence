import fp from "fastify-plugin";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { FastifyInstance } from "fastify";

// -------------------------
// Types
// -------------------------
// export interface PlayerInfo {
//   id: string;
//   name: string;
//   avatar?: string;
//   score: number;
// }

export interface GameData {
  gameId: string;
  mode: string;
  player1Id: string;
  player2Id: string;
  winnerId: string;
  score1: number;
  score2: number;
  createdAt?: number;
}

// export interface UserProfile {
//   id: string;
//   name: string;
//   avatar?: string;
// }

// -------------------------
// Plugin
// -------------------------

// export  const db = new Database("./src/db/game.sqlite");

export const db: Database.Database = new Database("./src/db/game.sqlite");

// Initialize database
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// Drop old tables with incorrect structure (remove this after first run)
try {
  db.prepare(`DROP TABLE IF EXISTS games`).run();
  console.log("🗑️  Dropped old games table");
} catch (error) {
  console.log("⚠️  Could not drop games table:", error);
}

// Create tables if they don't exist
const createTables = (db: Database.Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'paddle',
      mode TEXT NOT NULL,
      player1_id TEXT NOT NULL,
      player2_id TEXT NOT NULL,
      winner_id TEXT NOT NULL,
      score1 INTEGER NOT NULL,
      score2 INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
      
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_games_game_id ON games(game_id);
    CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
    CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
    CREATE INDEX IF NOT EXISTS idx_games_winner ON games(winner_id);
    CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at);
  `);
      
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
};

// Execute table creation
createTables(db);
console.log("✅ Database tables initialized");


// export default fp(async function gameDBPlugin(app: FastifyInstance) {
  

//   // Init database

//   db.pragma("foreign_keys = ON");
//   db.pragma("journal_mode = WAL");

//   app.log.info(`🎮 SQLite database connected: gameDB`);

//   createTables(db);

//   // -------------------------------------
//   // Expose methods through Fastify
//   // -------------------------------------
//   app.decorate("db", {
  //     saveGameResult: (gameData: GameData) => saveGameResult(db, gameData),
  //     getUserGames: (userId: string, limit = 10) =>
  //       getUserGames(db, userId, limit),
  
  //     getUserStats: (userId: string) => getUserStats(db, userId),
  //     getRecentGames: (limit = 10) => getRecentGames(db, limit),
  
  //     upsertUser: (user: UserProfile) => upsertUser(db, user),
  //     updateUserLevel: (userId: string, level: number) =>
  //       updateUserLevel(db, userId),
  
  //     getLeaderboard: (limit = 10) => getLeaderboard(db, limit),
  //   });
  // });
  
  // -------------------------
  // Table creation (moved above)
  // -------------------------

// -------------------------
// Game operations
// -------------------------
export const saveGameResult = (db: Database.Database, gameData: GameData) => {
  const stmt = db.prepare(`
    INSERT INTO games (
        game_id,
        mode,
        player1_id,
        player2_id,
        winner_id,
        score1,
        score2,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
  
    return stmt.run(
      gameData.gameId,
      gameData.mode,
      gameData.player1Id,
      gameData.player2Id,
      gameData.winnerId,
      gameData.score1,
      gameData.score2,
      gameData.createdAt || Date.now()
  ).lastInsertRowid;
};

// const getUserGames = (
//   db: Database.Database,
//   userId: string,
//   limit: number
// ) => {
//   const stmt = db.prepare(`
//     SELECT * FROM games
//     WHERE player1_id = ? OR player2_id = ?
//     ORDER BY created_at DESC
//     LIMIT ?
//   `);
//   return stmt.all(userId, userId, limit);
// };

// const getUserStats = (db: Database.Database, userId: string) => {
//   const games = db
//     .prepare(
//       `
//       SELECT * FROM games
//       WHERE player1_id = ? OR player2_id = ?
//     `
//     )
//     .all(userId, userId);

//   const wins = games.filter((g) => g.winner_id === userId).length;

//   return {
//     totalGames: games.length,
//     wins,
//     losses: games.length - wins,
//     level: games.length > 0 ? (wins / games.length) * 10 : 0,
//   };
// };

// const getRecentGames = (db: Database.Database, limit: number) => {
//   return db
//     .prepare(
//       `
//       SELECT * FROM games
//       ORDER BY created_at DESC
//       LIMIT ?
//     `
//     )
//     .all(limit);
// };

// -------------------------
// Users
// -------------------------
// const upsertUser = (db: Database.Database, user: UserProfile) => {
//   const stmt = db.prepare(`
//     INSERT INTO users (id, name, avatar, level, created_at, updated_at)
//     VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
//     ON CONFLICT(id) DO UPDATE SET
//       name = excluded.name,
//       avatar = excluded.avatar,
//       updated_at = CURRENT_TIMESTAMP
//   `);

//   return stmt.run(user.id, user.name, user.avatar);
// };

// const updateUserLevel = (
//   db: Database.Database,
//   userId: string,
//   level: number
// ) => {
//   return db
//     .prepare(`UPDATE users SET level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
//     .run(level, userId);
// };

// const getLeaderboard = (db: Database.Database, limit: number) => {
//   return db
//     .prepare(
//       `
//       SELECT id as user_id, name, avatar, level
//       FROM users
//       ORDER BY level DESC
//       LIMIT ?
//     `
//     )
//     .all(limit);
// };
