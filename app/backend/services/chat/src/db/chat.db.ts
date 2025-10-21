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

  -- Contacts
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    received_id INTEGER NOT NULL,
    UNIQUE(sender_id, received_id),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (received_id) REFERENCES users(id) ON DELETE CASCADE
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,  
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// const userInsert = db.prepare(`
//   INSERT INTO users (id, full_name, username, status) VALUES (?, ?, ?, ?)
// `);

// const contactInsert = db.prepare(`
//   INSERT INTO contacts (sender_id, received_id) VALUES (?, ?)
// `);

// const messageInsert = db.prepare(`
//   INSERT INTO messages (conversation_id, sender_id, received_id, text) VALUES (?, ?, ?, ?)
// `);

// userInsert.run(1, "Mehdi Serghini", "meserghi", "online");
// userInsert.run(2, "King Ana", "king", "online");

// const contact = contactInsert.run(1, 2);

// messageInsert.run(contact.lastInsertRowid, 1, 2, "Hello, world!");
