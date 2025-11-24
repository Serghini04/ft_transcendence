import db from './database.js';

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    rating INTEGER DEFAULT 1000,
    created_at INTEGER NOT NULL
  )`,

  // Games table
  `CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    board TEXT NOT NULL,
    current_turn TEXT NOT NULL,
    status TEXT NOT NULL,
    winner_id TEXT,
    winner_symbol TEXT,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    FOREIGN KEY (player1_id) REFERENCES users (id),
    FOREIGN KEY (player2_id) REFERENCES users (id),
    FOREIGN KEY (winner_id) REFERENCES users (id)
  )`,

  // Game history table
  `CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    winner_id TEXT,
    is_draw INTEGER DEFAULT 0,
    moves INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games (id),
    FOREIGN KEY (player1_id) REFERENCES users (id),
    FOREIGN KEY (player2_id) REFERENCES users (id),
    FOREIGN KEY (winner_id) REFERENCES users (id)
  )`,

  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)`,
  `CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id)`,
  `CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id)`,
  `CREATE INDEX IF NOT EXISTS idx_history_player1 ON game_history(player1_id)`,
  `CREATE INDEX IF NOT EXISTS idx_history_player2 ON game_history(player2_id)`,
  `CREATE INDEX IF NOT EXISTS idx_history_winner ON game_history(winner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating)`,
];

export function runMigrations(): void {
  console.log('Running database migrations...');
  
  db.exec('BEGIN TRANSACTION');
  
  try {
    migrations.forEach((migration, index) => {
      console.log(`Running migration ${index + 1}/${migrations.length}`);
      db.exec(migration);
    });
    
    db.exec('COMMIT');
    console.log('Migrations completed successfully!');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migrations if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
  process.exit(0);
}
