import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const db = await open({
  filename: "./notifications.sqlite",
  driver: sqlite3.Database,
});

await db.exec(`
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

// Add metadata column if it doesn't exist (migration)
try {
  await db.exec(`ALTER TABLE notifications ADD COLUMN metadata TEXT;`);
  console.log("✅ Added metadata column to notifications table");
} catch (error: any) {
  // Column already exists, ignore error
  if (!error.message?.includes("duplicate column name")) {
    console.error("Error adding metadata column:", error.message);
  }
}
