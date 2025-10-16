import Database from "better-sqlite3";

export const db = new Database("./src/db/chat.sqlite");

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insert = db.prepare("INSERT INTO messages (user_id, message) VALUES (?, ?)");
insert.run(1, "Hello, world!");
insert.run(2, "Hi Mehdi, welcome to the chat!");