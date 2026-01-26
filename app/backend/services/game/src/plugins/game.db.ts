import fp from "fastify-plugin";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { FastifyInstance } from "fastify";

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


// -------------------------
// Plugin
// -------------------------

// export  const db = new Database("./src/db/game.sqlite");

export const db: Database.Database = new Database("./src/db/game.sqlite");

// Initialize database
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// Drop old tables with incorrect structure (remove this after first run)
// try {
//   db.prepare(`DROP TABLE IF EXISTS games`).run();
//   console.log("🗑️  Dropped old games table");
// } catch (error) {
//   console.log("⚠️  Could not drop games table:", error);
// }

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

  // Tournament tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      max_players INTEGER NOT NULL,
      current_players INTEGER DEFAULT 0,
      visibility TEXT NOT NULL CHECK(visibility IN ('public', 'private')),
      status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'in_progress', 'completed')),
      created_at INTEGER NOT NULL,
      started_at INTEGER,
      completed_at INTEGER
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
    CREATE INDEX IF NOT EXISTS idx_tournaments_creator ON tournaments(creator_id);
    CREATE INDEX IF NOT EXISTS idx_tournaments_created ON tournaments(created_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      seed INTEGER,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      UNIQUE(tournament_id, user_id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_participants_user ON tournament_participants(user_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      round INTEGER NOT NULL,
      position INTEGER NOT NULL,
      player1_id TEXT,
      player2_id TEXT,
      winner_id TEXT,
      score1 INTEGER,
      score2 INTEGER,
      scheduled_at INTEGER,
      completed_at INTEGER,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournament_matches(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_matches_round ON tournament_matches(tournament_id, round);
  `);

  // Relationships table (synced from chat service via Kafka)
  db.exec(`
    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('friend', 'blocked', 'pending')),
      blocked_by_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user1_id, user2_id),
      FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (blocked_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_relationships_user1 ON relationships(user1_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_user2 ON relationships(user2_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(type);
  `);

  // Tournament invitations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      inviter_id TEXT NOT NULL,
      invitee_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
      created_at INTEGER NOT NULL,
      responded_at INTEGER,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      UNIQUE(tournament_id, invitee_id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invitations_tournament ON tournament_invitations(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON tournament_invitations(invitee_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_status ON tournament_invitations(status);
  `);
};

// Execute table creation
createTables(db);
console.log("✅ Database tables initialized (including tournaments)");

// Seed users FIRST (before relationships)
// const seedUsers = () => {
//   const userInsert = db.prepare(`
//     INSERT OR IGNORE INTO users (id, name, avatar, level) VALUES (?, ?, ?, ?)
//   `);
  
//   userInsert.run('1', 'User 1', '', 0);
//   userInsert.run('2', 'User 2', '', 0);
//   userInsert.run('3', 'User 3', '', 0);
//   userInsert.run('4', 'User 4', '', 0);
  
//   console.log("✅ Users seeded");
// };

// Only seed if there are no users yet
// const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
// if (userCount.count === 0) {
//   seedUsers();
// }

console.log("ℹ️ Relationships will be synced from chat service via Kafka");

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
      gameData.createdAt
  ).lastInsertRowid;
};

