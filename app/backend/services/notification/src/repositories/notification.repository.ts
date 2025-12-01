import Database from "better-sqlite3";
import { Notification } from "../models/notification";

export class NotificationRepository {
  constructor(private db: Database.Database) {}

  getUserNotifications(userId: number): Notification[] {
    const stmt = this.db.prepare(`
      SELECT id, userId, title, message, read, createdAt
      FROM notifications
      WHERE userId = ?
      ORDER BY createdAt DESC;
    `);

    const rows = stmt.all(userId) as any[];
    return rows.map((row: any) => ({
      ...row,
      read: !!row.read,
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
}
