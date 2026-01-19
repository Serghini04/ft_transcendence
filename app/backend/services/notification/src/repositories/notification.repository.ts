import Database from "better-sqlite3";
import { Notification } from "../models/notification";

export class NotificationRepository {
  constructor(private db: Database.Database) {}

  getUserNotifications(userId: number): Notification[] {
    const stmt = this.db.prepare(`
      SELECT id, userId, title, message, type, metadata, read, createdAt
      FROM notifications
      WHERE userId = ?
      ORDER BY createdAt DESC;
    `);

    const rows = stmt.all(userId) as any[];
    return rows.map((row: any) => ({
      ...row,
      read: !!row.read,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    })) as Notification[];
  }

  markAllAsRead(userId: number) {
    const stmt = this.db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE userId = ? AND read = 0;
    `);

    stmt.run(userId);
  }

  getUnreadCount(userId: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE userId = ? AND read = 0;
    `);

    const row = stmt.get(userId) as { count: number };
    return row.count;
  }

  createNotification(userId: number, title: string, message: string, type: string = 'message', metadata?: any): Notification {
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    const stmt = this.db.prepare(`
      INSERT INTO notifications (userId, title, message, type, metadata, read, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `);

    const result = stmt.run(userId, title, message, type, metadataStr);
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
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    } as Notification;
  }
}
