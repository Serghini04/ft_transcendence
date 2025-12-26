import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type BetterSqlite3 from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../data/tictac.db');
const dbDir = dirname(dbPath);

// Ensure data directory exists
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db: BetterSqlite3.Database = new Database(dbPath);
db.pragma('journal_mode = WAL');

export default db;
