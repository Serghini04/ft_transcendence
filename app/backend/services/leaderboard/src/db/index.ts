import Database from "better-sqlite3";

export const db = new Database("./src/db/leaderboard.sqlite");

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    winner_id TEXT NOT NULL,
    score1 INTEGER NOT NULL,
    score2 INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_player1 ON games(player1_id);
  CREATE INDEX IF NOT EXISTS idx_player2 ON games(player2_id);
  CREATE INDEX IF NOT EXISTS idx_winner ON games(winner_id);
  CREATE INDEX IF NOT EXISTS idx_created ON games(created_at);

  CREATE TABLE IF NOT EXISTS player_stats (
    user_id TEXT PRIMARY KEY,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_game_at INTEGER,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_wins ON player_stats(wins DESC);
  CREATE INDEX IF NOT EXISTS idx_total_games ON player_stats(total_games DESC);
`);

console.log("✅ Leaderboard database initialized");

// Insert game from Kafka event
export const insertGame = (gameData: {
  gameId: string;
  mode: string;
  player1Id: string;
  player2Id: string;
  winnerId: string;
  score1: number;
  score2: number;
  createdAt: number;
}) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO games (game_id, mode, player1_id, player2_id, winner_id, score1, score2, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      gameData.gameId,
      gameData.mode,
      gameData.player1Id,
      gameData.player2Id,
      gameData.winnerId,
      gameData.score1,
      gameData.score2,
      gameData.createdAt
    );

    console.log(`✅ Game ${gameData.gameId} inserted into leaderboard DB`);
    return result;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log(`⚠️ Game ${gameData.gameId} already exists, skipping...`);
    } else {
      console.error("❌ Failed to insert game:", error);
      throw error;
    }
  }
};

// Update player statistics
export const updatePlayerStats = (
  userId: string,
  isWinner: boolean,
  scoreGained: number,
  gameTimestamp: number
) => {
  const stmt = db.prepare(`
    INSERT INTO player_stats (user_id, total_games, wins, losses, total_score, win_streak, best_streak, last_game_at, updated_at)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      total_games = total_games + 1,
      wins = wins + ?,
      losses = losses + ?,
      total_score = total_score + ?,
      win_streak = CASE WHEN ? THEN win_streak + 1 ELSE 0 END,
      best_streak = MAX(best_streak, CASE WHEN ? THEN win_streak + 1 ELSE 0 END),
      last_game_at = ?,
      updated_at = ?
  `);

  const wins = isWinner ? 1 : 0;
  const losses = isWinner ? 0 : 1;
  const now = Math.floor(Date.now() / 1000);

  return stmt.run(
    userId,      // user_id for INSERT
    wins,        // wins for INSERT
    losses,      // losses for INSERT
    scoreGained, // total_score for INSERT
    wins,        // win_streak for INSERT (initial)
    wins,        // best_streak for INSERT (initial)
    gameTimestamp, // last_game_at for INSERT
    now,         // updated_at for INSERT
    wins,        // increment wins in UPDATE
    losses,      // increment losses in UPDATE
    scoreGained, // increment total_score in UPDATE
    wins,        // isWinner for CASE (converted to 0/1)
    wins,        // isWinner for CASE (converted to 0/1)
    gameTimestamp, // last_game_at for UPDATE
    now          // updated_at for UPDATE
  );
};

// Get leaderboard
export const getLeaderboard = (limit: number = 100) => {
  return db.prepare(`
    SELECT 
      user_id,
      total_games,
      wins,
      losses,
      total_score,
      win_streak,
      best_streak,
      ROUND(CAST(wins AS FLOAT) / NULLIF(total_games, 0) * 100, 2) as win_rate,
      last_game_at
    FROM player_stats
    ORDER BY wins DESC, total_score DESC
    LIMIT ?
  `).all(limit);
};

// Get player stats
export const getPlayerStats = (userId: string) => {
  return db.prepare(`
    SELECT * FROM player_stats WHERE user_id = ?
  `).get(userId);
};

// Get player's game history
export const getPlayerGames = (userId: string, limit: number = 20) => {
  return db.prepare(`
    SELECT * FROM games 
    WHERE player1_id = ? OR player2_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, userId, limit);
};