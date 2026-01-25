#!/usr/bin/env tsx
/**
 * Migration script to convert TicTacToe stats from Firebase UIDs to numeric user IDs
 * 
 * This script should be run once to clean up existing data before deploying the ID mapper fix.
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import { fileURLToPath } from 'url';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leaderboardDbPath = path.join(__dirname, '../../../../../infra/data/leaderboard.db');
const userAuthDbPath = path.join(__dirname, '../../../../../infra/data/user_auth/user_auth.db');

console.log('🔄 Starting TicTacToe stats migration...\n');

try {
  const leaderboardDb = new Database(leaderboardDbPath);
  const userAuthDb = new Database(userAuthDbPath);

  // Get all tictactoe_stats rows
  const stats = leaderboardDb.prepare('SELECT * FROM tictactoe_stats').all();
  
  console.log(`Found ${stats.length} TicTacToe stats records\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const stat of stats as any[]) {
    const oldUserId = stat.user_id;
    
    // Check if it's already numeric
    const numericId = parseInt(oldUserId);
    if (!isNaN(numericId) && numericId.toString() === oldUserId) {
      console.log(`✓ Skipping ${oldUserId} (already numeric)`);
      skipped++;
      continue;
    }

    // Try to find user by username
    const user = userAuthDb.prepare('SELECT id FROM users WHERE name = ?').get(oldUserId) as { id: number } | undefined;
    
    if (!user) {
      console.log(`❌ Could not find user for "${oldUserId}"`);
      errors++;
      continue;
    }

    // Update the user_id to numeric
    try {
      leaderboardDb.prepare(`
        UPDATE tictactoe_stats 
        SET user_id = ? 
        WHERE user_id = ?
      `).run(String(user.id), oldUserId);
      
      console.log(`✅ Migrated "${oldUserId}" → ${user.id}`);
      migrated++;
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint')) {
        // Numeric user already exists, merge stats
        console.log(`⚠️  Merging stats for "${oldUserId}" → ${user.id}`);
        leaderboardDb.prepare(`
          UPDATE tictactoe_stats 
          SET 
            total_games = total_games + ?,
            wins = wins + ?,
            losses = losses + ?,
            draws = draws + ?,
            best_streak = MAX(best_streak, ?)
          WHERE user_id = ?
        `).run(stat.total_games, stat.wins, stat.losses, stat.draws, stat.best_streak, String(user.id));
        
        // Delete old record
        leaderboardDb.prepare('DELETE FROM tictactoe_stats WHERE user_id = ?').run(oldUserId);
        migrated++;
      } else {
        console.log(`❌ Error migrating "${oldUserId}":`, err.message);
        errors++;
      }
    }
  }

  userAuthDb.close();
  leaderboardDb.close();

  console.log('\n📊 Migration Summary:');
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log('\n✅ Migration complete!\n');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
