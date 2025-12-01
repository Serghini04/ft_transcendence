import { FastifyRequest, FastifyReply } from "fastify";
import { NotificationRepository } from "../repositories/notification.repository";

async function getUserNotifications(req: FastifyRequest, res: FastifyReply) {
  const notificationRepo = new NotificationRepository(req.server.db);
  const userId = Number(req.headers["x-user-id"]);

  const notifications = await notificationRepo.getUserNotifications(userId);
  return res.code(200).send(notifications);
}

async function markAllAsRead(req: FastifyRequest, res: FastifyReply) {
  const notificationRepo = new NotificationRepository(req.server.db);
  const userId = Number(req.headers["x-user-id"]);

  await notificationRepo.markAllAsRead(userId);

  return res.code(200).send({
    message: "All notifications marked as read"
  });
}

async function getUnreadNotificationsCount(
  req: FastifyRequest,
  res: FastifyReply
) {
  const notificationRepo = new NotificationRepository(req.server.db);
  const userId = Number(req.headers["x-user-id"]);

  const count = await notificationRepo.getUnreadCount(userId);

  return res.code(200).send({
    unread: count
  });
}

export const notificationController = {
  getUserNotifications,
  markAllAsRead,
  getUnreadNotificationsCount,
};
