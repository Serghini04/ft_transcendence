import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the user_auth database
// In Docker, the database is mounted at /app/shared/userauth/database.db
// In development, it's at the relative path
const userAuthDbPath = process.env.NODE_ENV === 'production' 
  ? '/app/shared/userauth/database.db'
  : path.join(__dirname, '../../../../../infra/data/user_auth/user_auth.db');
let userAuthDb: Database.Database | null = null;

function getUserAuthDb(): Database.Database {
  if (!userAuthDb) {
    try {
      userAuthDb = new Database(userAuthDbPath);
      console.log('✅ Connected to user_auth database for ID mapping');
    } catch (error) {
      console.error('❌ Failed to connect to user_auth database:', error);
      throw error;
    }
  }
  return userAuthDb;
}

/**
 * Maps a TicTacToe user identifier to a numeric user ID from the main user database.
 * 
 * The TicTacToe service uses username-based IDs (nanoid), but we need to convert
 * these to numeric user IDs that match the main user_auth database for unified leaderboard tracking.
 * 
 * @param tictacUserId - The username or nanoid from TicTacToe service
 * @returns The numeric user ID, or null if not found
 */
export function mapToNumericUserId(tictacUserId: string): number | null {
  try {
    const db = getUserAuthDb();
    
    // First, try to find by username (most common case)
    const userByName = db.prepare('SELECT id FROM users WHERE name = ?').get(tictacUserId) as { id: number } | undefined;
    
    if (userByName) {
      return userByName.id;
    }
    
    // If the tictacUserId is already numeric, validate it exists
    const numericId = parseInt(tictacUserId);
    if (!isNaN(numericId)) {
      const userById = db.prepare('SELECT id FROM users WHERE id = ?').get(numericId) as { id: number } | undefined;
      if (userById) {
        return userById.id;
      }
    }
    
    console.warn(`⚠️ Could not map TicTacToe user ID "${tictacUserId}" to numeric user ID`);
    return null;
  } catch (error) {
    console.error('Error mapping user ID:', error);
    return null;
  }
}

/**
 * Closes the user_auth database connection
 */
export function closeUserAuthConnection(): void {
  if (userAuthDb) {
    userAuthDb.close();
    userAuthDb = null;
    console.log('Closed user_auth database connection');
  }
}
