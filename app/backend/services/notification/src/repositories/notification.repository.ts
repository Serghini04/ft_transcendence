import Database from "better-sqlite3";
import { Notification } from "../models/notification";

export class NotificationRepository {
  constructor(private db: Database.Database) {}

  getUserNotifications(userId: number | string): Notification[] {
    const stmt = this.db.prepare(`
      SELECT id, userId, title, message, type, metadata, read, createdAt
      FROM notifications
      WHERE userId = ?
      ORDER BY createdAt DESC;
    `);

    // Convert to string since database stores TEXT
    const userIdStr = String(userId);
    const rows = stmt.all(userIdStr) as any[];
    return rows.map((row: any) => ({
      ...row,
      read: !!row.read,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    })) as Notification[];
  }

  markAllAsRead(userId: number | string) {
    const stmt = this.db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE userId = ? AND read = 0;
    `);

    stmt.run(String(userId));
  }

  getUnreadCount(userId: number | string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE userId = ? AND read = 0;
    `);

    const row = stmt.get(String(userId)) as { count: number };
    return row.count;
  }

  updateNotificationMetadata(userId: string, invitationId: number, status: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE notifications
      SET metadata = json_set(metadata, '$.status', ?)
      WHERE userId = ?
      AND json_extract(metadata, '$.invitationId') = ?
      AND type = 'tournament_invite'
    `);

    const result = stmt.run(status, userId, invitationId);
    return result.changes > 0;
  }

  createNotification(userId: number | string, title: string, message: string, type: string = 'message', metadata?: any): Notification {
    const stmt = this.db.prepare(`
      INSERT INTO notifications (userId, title, message, type, metadata, read, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `);

    // Convert userId to string since database expects TEXT
    const userIdStr = String(userId);
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    const result = stmt.run(userIdStr, title, message, type, metadataStr);
    const notificationId = result.lastInsertRowid as number;

    const getStmt = this.db.prepare(`
      SELECT id, userId, title, message, type, metadata, read, createdAt
      FROM notifications
      WHERE id = ?
    `);

    const row = getStmt.get(notificationId) as any;
    return {
      ...row,
      read: !!row.read,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    } as Notification;
  }
}
