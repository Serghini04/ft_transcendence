import { db } from "../db";
import { io } from "../socket";

export const NotificationService = {
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
  }) {
    const result = await db.run(
      `
      INSERT INTO notifications (userId, title, message, type)
      VALUES (?, ?, ?, ?)
    `,
      [data.userId, data.title, data.message, data.type]
    );

    const notification = {
      id: result.lastID,
      ...data,
      read: 0,
      createdAt: new Date().toISOString(),
    };

    // Emit to the specific user room
    io.to(`user:${data.userId}`).emit("notification:new", notification);

    return notification;
  },

  async getUserNotifications(userId: string) {
    return db.all(
      `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
  },

  async markAsRead(id: number) {
    await db.run(`UPDATE notifications SET read = 1 WHERE id = ?`, [id]);
  },
};
