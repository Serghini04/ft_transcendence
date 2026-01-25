import Database from "better-sqlite3";

export const db = new Database("./src/db/notification.sqlite");

db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        metadata TEXT,
        read INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

// Add metadata column if it doesn't exist (migration for existing databases)
try {
  db.exec(`ALTER TABLE notifications ADD COLUMN metadata TEXT;`);
  console.log("✅ Added metadata column to notifications table");
} catch (error: any) {
  // Column already exists or other error - this is fine
  if (error.message && !error.message.includes("duplicate column name")) {
    // Only log if it's not a "column already exists" error
    console.log("ℹ️ Metadata column already exists or table is new");
  }
}