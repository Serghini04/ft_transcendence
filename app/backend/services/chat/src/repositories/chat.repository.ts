import Database from "better-sqlite3";
import { Relationship } from "../models/relationship";
import { User, UserStatus } from "../models/user";
import { Message } from "../models/message";


export class ChatRepository {
    constructor(private db: Database.Database) {}

    getContacts(userId: number): Relationship[] {
      const stmt = this.db.prepare(`
        SELECT
          relationships.id AS id,
          CASE 
            WHEN relationships.user1_id = ? THEN relationships.user2_id
            ELSE relationships.user1_id
          END AS contact_id,
          u.full_name AS contact_full_name,
          u.username AS contact_username,
          u.status AS contact_status,
          u.avatar_url AS contact_avatar_url,
          CASE WHEN relationships.type = 'blocked' THEN 1 ELSE 0 END AS is_blocked,
          relationships.unseen_messages AS unseen_messages
        FROM relationships
        JOIN users AS u 
          ON u.id = CASE 
                      WHEN relationships.user1_id = ? THEN relationships.user2_id
                      ELSE relationships.user1_id
                    END
        WHERE relationships.user1_id = ? OR relationships.user2_id = ?;
      `);
    
      const rows = stmt.all(userId, userId, userId, userId) as {
        id: number;
        contact_id: number;
        contact_full_name: string;
        contact_username: string;
        contact_status: string;
        contact_avatar_url: string;
        is_blocked: boolean;
        unseen_messages: number
      }[];
    
      return rows.map(row =>
        new Relationship(
          row.id,
          new User(row.contact_id, row.contact_full_name, row.contact_username, row.contact_status, row.contact_avatar_url),
          !!row.is_blocked,
          row.unseen_messages
        ),
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

    sendMessage(senderId: number, receivedId: number, text: string, timestamp: string) {
      const stmt = this.db.prepare(`
        INSERT INTO messages (sender_id, received_id, text, timestamp) VALUES (?, ?, ?, ?);
      `);
      const res = stmt.run(senderId, receivedId, text, timestamp);
      return {success: res.changes > 0, messageId: res.lastInsertRowid};
    }
}