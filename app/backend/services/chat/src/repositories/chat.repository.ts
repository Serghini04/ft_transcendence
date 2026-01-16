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
          u.avatar_url AS contact_avatar_url,
          u.bg_photo_url AS contact_bg_photo_url,
          u.bio AS contact_bio,
          u.showNotifications AS contact_show_notifications,
          CASE 
            WHEN relationships.type = 'blocked' AND relationships.blocked_by_user_id = ? THEN 'blocked_by_me'
            WHEN relationships.type = 'blocked' AND relationships.blocked_by_user_id != ? THEN 'blocked_by_them'
            ELSE 'none'
          END AS block_status,
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
        WHERE
          (relationships.user1_id = ? OR relationships.user2_id = ?)
          AND relationships.type IN ('friend', 'blocked');
      `);
    
      const rows = stmt.all(userId, userId, userId, userId, userId, userId, userId) as {
        id: number;
        contact_id: number;
        contact_full_name: string;
        contact_avatar_url: string;
        contact_bg_photo_url: string;
        contact_bio: string;
        contact_show_notifications: number;
        block_status: 'blocked_by_me' | 'blocked_by_them' | 'none';
        unseen_messages: number
      }[];
    
      return rows.map(row =>
        new Relationship(
          row.id,
          new User(row.contact_id, row.contact_full_name, row.contact_avatar_url, row.contact_bg_photo_url, row.contact_bio, !!row.contact_show_notifications),
          row.block_status,
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

  validateUserRelationship(senderId: number, receiverId: number): { 
    canMessage: boolean; 
    reason?: string;
    senderName?: string;
    receiverName?: string;
    receiverShowNotifications?: boolean;
  } {

    const stmt = this.db.prepare(`
      SELECT 
        u1.id as sender_id,
        u1.full_name as sender_name,
        u2.id as receiver_id,
        u2.full_name as receiver_name,
        u2.showNotifications as receiver_show_notifications,
        r.type as relationship_type
      FROM users u1
      LEFT JOIN users u2 ON u2.id = ?
      LEFT JOIN relationships r ON 
        (r.user1_id = u1.id AND r.user2_id = u2.id) OR 
        (r.user1_id = u2.id AND r.user2_id = u1.id)
      WHERE u1.id = ?
    `);

    const result = stmt.get(receiverId, senderId) as {
      sender_id: number | null;
      sender_name: string;
      receiver_id: number | null;
      receiver_name: string;
      receiver_show_notifications: number;
      relationship_type: string | null;
    } | undefined;

    if (!result || !result.sender_id)
      return { canMessage: false, reason: "Sender does not exist" };

    if (!result.receiver_id)
      return { canMessage: false, reason: "Receiver does not exist" };

    if (!result.relationship_type)
      return { canMessage: false, reason: "You are not friends" };

    if (result.relationship_type !== "friend") {
      return { 
        canMessage: false, 
        reason: result.relationship_type === "blocked" 
          ? "Cannot send message: user is blocked" 
          : "You are not friends" 
      };
    }

    return { 
      canMessage: true,
      senderName: result.sender_name,
      receiverName: result.receiver_name,
      receiverShowNotifications: !!result.receiver_show_notifications,
    };
  }

  blockUser(blockerId: number, blockedId: number): { success: boolean; message: string } {
    try {
      const stmt = this.db.prepare(`
        UPDATE relationships 
        SET type = 'blocked', blocked_by_user_id = ?
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `);
      const result = stmt.run(blockerId, blockerId, blockedId, blockedId, blockerId);
      
      if (result.changes > 0) {
        return { success: true, message: 'User blocked successfully' };
      }
      return { success: false, message: 'Relationship not found' };
    } catch (error) {
      return { success: false, message: 'Failed to block user' };
    }
  }

  unblockUser(unblockerId: number, blockedId: number): { success: boolean; message: string } {
    try {
      const stmt = this.db.prepare(`
        UPDATE relationships 
        SET type = 'friend', blocked_by_user_id = NULL
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
        AND blocked_by_user_id = ?
      `);
      const result = stmt.run(unblockerId, blockedId, blockedId, unblockerId, unblockerId);
      
      if (result.changes > 0) {
        return { success: true, message: 'User unblocked successfully' };
      }
      return { success: false, message: 'Cannot unblock: you did not block this user' };
    } catch (error) {
      return { success: false, message: 'Failed to unblock user' };
    }
  }

  sendFriendRequest(senderId: number, receiverId: number): { success: boolean; message: string } {
    try {
      // Check if relationship already exists
      const checkStmt = this.db.prepare(`
        SELECT type FROM relationships 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `);
      const existing = checkStmt.get(senderId, receiverId, receiverId, senderId) as { type: string } | undefined;

      if (existing) {
        if (existing.type === 'friend') {
          return { success: false, message: 'Already friends' };
        }
        if (existing.type === 'pending') {
          return { success: false, message: 'Friend request already sent' };
        }
        if (existing.type === 'blocked') {
          return { success: false, message: 'Cannot send friend request' };
        }
      }

      // Ensure user1_id < user2_id for consistency
      const [user1_id, user2_id] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];

      const stmt = this.db.prepare(`
        INSERT INTO relationships (user1_id, user2_id, type)
        VALUES (?, ?, 'pending')
      `);
      const result = stmt.run(user1_id, user2_id);

      if (result.changes > 0) {
        return { success: true, message: 'Friend request sent' };
      }
      return { success: false, message: 'Failed to send friend request' };
    } catch (error) {
      return { success: false, message: 'Failed to send friend request' };
    }
  }

  acceptFriendRequest(userId: number, requesterId: number): { success: boolean; message: string } {
    try {
      const stmt = this.db.prepare(`
        UPDATE relationships 
        SET type = 'friend'
        WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
        AND type = 'pending'
      `);
      const result = stmt.run(userId, requesterId, requesterId, userId);

      if (result.changes > 0) {
        return { success: true, message: 'Friend request accepted' };
      }
      return { success: false, message: 'Friend request not found' };
    } catch (error) {
      return { success: false, message: 'Failed to accept friend request' };
    }
  }

  rejectFriendRequest(userId: number, requesterId: number): { success: boolean; message: string } {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM relationships 
        WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
        AND type = 'pending'
      `);
      const result = stmt.run(userId, requesterId, requesterId, userId);

      if (result.changes > 0) {
        return { success: true, message: 'Friend request rejected' };
      }
      return { success: false, message: 'Friend request not found' };
    } catch (error) {
      return { success: false, message: 'Failed to reject friend request' };
    }
  }

  getPendingRequests(userId: number): { incoming: User[], outgoing: User[] } {
    // Incoming requests (where userId is user2 or user1 but not the one who initiated)
    const incomingStmt = this.db.prepare(`
      SELECT u.id, u.full_name, u.avatar_url, u.bg_photo_url, u.bio
      FROM relationships r
      JOIN users u ON (
        CASE 
          WHEN r.user1_id = ? THEN r.user2_id
          ELSE r.user1_id
        END = u.id
      )
      WHERE ((r.user1_id = ? AND r.user1_id < r.user2_id) OR (r.user2_id = ? AND r.user1_id > r.user2_id))
      AND r.type = 'pending'
    `);

    const incomingRows = incomingStmt.all(userId, userId, userId) as {
      id: number;
      full_name: string;
      avatar_url: string;
      bg_photo_url: string;
      bio: string;
    }[];

    // Outgoing requests (requests sent by userId)
    const outgoingStmt = this.db.prepare(`
      SELECT u.id, u.full_name, u.avatar_url, u.bg_photo_url, u.bio
      FROM relationships r
      JOIN users u ON (
        CASE 
          WHEN r.user1_id = ? THEN r.user2_id
          ELSE r.user1_id
        END = u.id
      )
      WHERE ((r.user1_id = ? AND r.user1_id > r.user2_id) OR (r.user2_id = ? AND r.user1_id < r.user2_id))
      AND r.type = 'pending'
    `);

    const outgoingRows = outgoingStmt.all(userId, userId, userId) as {
      id: number;
      full_name: string;
      avatar_url: string;
      bg_photo_url: string;
      bio: string;
    }[];

    return {
      incoming: incomingRows.map(row => new User(row.id, row.full_name, row.avatar_url, row.bg_photo_url, row.bio, true)),
      outgoing: outgoingRows.map(row => new User(row.id, row.full_name, row.avatar_url, row.bg_photo_url, row.bio, true))
    };
  }

  getFriends(userId: number): User[] {
    const stmt = this.db.prepare(`
      SELECT u.id, u.full_name, u.avatar_url, u.bg_photo_url, u.bio
      FROM relationships r
      JOIN users u ON (
        CASE 
          WHEN r.user1_id = ? THEN r.user2_id
          ELSE r.user1_id
        END = u.id
      )
      WHERE (r.user1_id = ? OR r.user2_id = ?)
      AND r.type = 'friend'
    `);

    const rows = stmt.all(userId, userId, userId) as {
      id: number;
      full_name: string;
      avatar_url: string;
      bg_photo_url: string;
      bio: string;
    }[];

    return rows.map(row => new User(row.id, row.full_name, row.avatar_url, row.bg_photo_url, row.bio, true));
  }

  removeFriend(userId: number, friendId: number): { success: boolean; message: string } {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM relationships 
        WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
        AND type = 'friend'
      `);
      const result = stmt.run(userId, friendId, friendId, userId);

      if (result.changes > 0) {
        return { success: true, message: 'Friend removed successfully' };
      }
      return { success: false, message: 'Friend relationship not found' };
    } catch (error) {
      return { success: false, message: 'Failed to remove friend' };
    }
  }

  getFriendshipStatus(userId: number, targetUserId: number): { 
    status: 'none' | 'pending_sent' | 'pending_received' | 'friend' | 'blocked';
    relationshipId?: number;
  } {
    const stmt = this.db.prepare(`
      SELECT id, type, user1_id, user2_id
      FROM relationships 
      WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
    `);
    
    const result = stmt.get(userId, targetUserId, targetUserId, userId) as {
      id: number;
      type: string;
      user1_id: number;
      user2_id: number;
    } | undefined;

    if (!result) {
      return { status: 'none' };
    }

    if (result.type === 'friend') {
      return { status: 'friend', relationshipId: result.id };
    }

    if (result.type === 'blocked') {
      return { status: 'blocked', relationshipId: result.id };
    }

    if (result.type === 'pending') {
      // Determine who sent the request based on user ID ordering
      const isSender = (result.user1_id < result.user2_id && result.user1_id === userId) ||
                       (result.user1_id > result.user2_id && result.user2_id === userId);
      
      return { 
        status: isSender ? 'pending_sent' : 'pending_received',
        relationshipId: result.id 
      };
    }

    return { status: 'none' };
  }

}