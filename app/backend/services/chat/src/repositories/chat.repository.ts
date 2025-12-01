import Database from "better-sqlite3";
import { Relationship } from "../models/relationship";
import { User } from "../models/user";
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
          CASE 
            WHEN relationships.user1_id = ? THEN relationships.user1_unseen_messages
            ELSE relationships.user2_unseen_messages
          END AS unseen_messages
        FROM relationships
        JOIN users AS u 
          ON u.id = CASE 
                      WHEN relationships.user1_id = ? THEN relationships.user2_id
                      ELSE relationships.user1_id
                    END
        WHERE relationships.user1_id = ? OR relationships.user2_id = ?;
      `);
    
      const rows = stmt.all(userId, userId, userId, userId, userId) as {
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
        WHERE (sender_id = ? AND received_id = ?) OR (sender_id = ? AND received_id = ?)
        ORDER BY timestamp ASC;
      `);
      const rows = stmt.all(currentUserId, currentUserId, otherUserId, otherUserId, currentUserId) as {
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
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return {success: false, messageId: null, error: "Invalid message text"};
      }
      
      if (text.length > 1000)
        return {success: false, messageId: null, error: "Message too long"};
      const sanitizedText = text.trim().substring(0, 1000);
      
      const stmt = this.db.prepare(`
        INSERT INTO messages (sender_id, received_id, text, timestamp) VALUES (?, ?, ?, ?);
      `);
      const res = stmt.run(senderId, receivedId, sanitizedText, timestamp);
      
      if (res.changes > 0)
        this.incrementUnseenMessages(senderId, receivedId);
      
      return {success: res.changes > 0, messageId: res.lastInsertRowid};
    }

    incrementUnseenMessages(senderId: number, receiverId: number) {
      const stmt = this.db.prepare(`
        UPDATE relationships 
        SET user1_unseen_messages = CASE 
          WHEN user1_id = ? THEN user1_unseen_messages + 1 
          ELSE user1_unseen_messages 
        END,
        user2_unseen_messages = CASE 
          WHEN user2_id = ? THEN user2_unseen_messages + 1 
          ELSE user2_unseen_messages 
        END
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `);
      stmt.run(receiverId, receiverId, senderId, receiverId, receiverId, senderId);
    }

    markMessagesAsSeen(currentUserId: number, otherUserId: number) {
      const stmt = this.db.prepare(`
        UPDATE relationships 
        SET user1_unseen_messages = CASE 
          WHEN user1_id = ? THEN 0 
          ELSE user1_unseen_messages 
        END,
        user2_unseen_messages = CASE 
          WHEN user2_id = ? THEN 0 
          ELSE user2_unseen_messages 
        END
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `);
      stmt.run(currentUserId, currentUserId, currentUserId, otherUserId, otherUserId, currentUserId);
    }
}