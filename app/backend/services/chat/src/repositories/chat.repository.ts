import Database from "better-sqlite3";
import { Contact } from "../models/contact";
// import { Message } from "../models/message";
import { User, UserStatus } from "../models/user";
import { Message } from "../models/message";


export class ChatRepository {
    constructor(private db: Database.Database) {}

    getContacts(userId: number): Contact[] {
      const stmt = this.db.prepare(`
        SELECT
          contacts.id AS contact_id,
          users.id AS user_id,
          users.full_name,
          users.username,
          users.status,
          users.avatar_url,
          CASE
              WHEN relationships.type = 'blocked' THEN 1
              ELSE 0
          END AS is_blocked
        FROM contacts
        JOIN users 
          ON users.id = CASE 
              WHEN contacts.sender_id = ? THEN contacts.received_id
              ELSE contacts.sender_id
          END
        LEFT JOIN relationships
          ON (relationships.user1_id = ? AND relationships.user2_id = users.id)
          OR (relationships.user2_id = ? AND relationships.user1_id = users.id)
        WHERE ? IN (contacts.sender_id, contacts.received_id);
      `);
    
      const rows = stmt.all(userId, userId, userId, userId) as {
        contact_id: number;
        user_id: number;
        full_name: string;
        username: string;
        status: UserStatus;
        avatar_url: string;
        is_blocked: boolean;
      }[];
    
      return rows.map(row =>
        new Contact(
          row.contact_id,
          new User(
            row.user_id,
            row.full_name,
            row.username,
            row.status,
            row.avatar_url
          ),
          !!row.is_blocked
        )
      );
    }

    getConversationBetweenUsers(currentUserId: number, otherUserId: number) {
      const stmt = this.db.prepare(`
        SELECT
          id,
          CASE
            WHEN sender_id = ? THEN 1
            ELSE 0
          END AS isSender,
          text,
          timestamp
        FROM messages
        WHERE ? IN (messages.sender_id, messages.received_id);
      `);
      const rows = stmt.all(currentUserId, otherUserId) as {
        id: number;
        timestamp: Date;
        text: string;
        isSender: boolean;
      }[];
    
      return rows.map(row => new Message(
                      row.id,
                      row.timestamp,
                      row.text,
                      !!row.isSender
                  ));
    }

    sendMessage(senderId: number, receivedId: number, text: string) {
      const stmt = this.db.prepare(`
        INSERT INTO messages (sender_id, received_id, text) VALUE (?, ?, ?);
      `);
      const res = stmt.run(senderId, receivedId, text);
      return {success: res.changes > 0};
    }
}