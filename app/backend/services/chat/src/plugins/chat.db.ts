import Database from "better-sqlite3";

export const db = new Database("./src/db/chat.sqlite");

db.exec(`
  -- Users (from User Service)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'offline',
    avatar_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Messages
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    received_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,  
    FOREIGN KEY (received_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Relationships
  CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK(type IN ('friend', 'blocked', 'pending')),
    blocked_by_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user1_unseen_messages INTEGER NOT NULL DEFAULT 0,
    user2_unseen_messages INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_by_user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const relationshipsInsert = db.prepare(`
  INSERT INTO relationships (user1_id, user2_id, type) VALUES (?, ?, ?)
`);

const userInsert = db.prepare(`
  INSERT OR IGNORE INTO users (id, full_name, username, status) VALUES (?, ?, ?, ?)
`);

// const messageInsert = db.prepare(`
//   INSERT INTO messages (sender_id, received_id, text) VALUES (?, ?, ?)
// `);

// userInsert.run(1, "Mehdi Serghini", "meserghi", "online");
// userInsert.run(2, "King Ana", "king", "online");

// relationshipsInsert.run(1, 2, 'friend');

// messageInsert.run(1, 2, "hey, king!");
// messageInsert.run(2, 1, "hey, Mehdi!");
// messageInsert.run(2, 1, "how are you?");
// messageInsert.run(1, 2, "I'm fine");

// Seed users (will be synced from Kafka in production)
userInsert.run(1, "User 1", "user1", "offline");
userInsert.run(2, "User 2", "user2", "offline");
userInsert.run(3, "User 3", "user3", "offline");
userInsert.run(4, "User 4", "user4", "offline");

// Make user1 friends with all other users
relationshipsInsert.run(1, 2, 'friend');
relationshipsInsert.run(1, 3, 'friend');
relationshipsInsert.run(1, 4, 'friend');