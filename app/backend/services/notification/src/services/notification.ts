import { FastifyRequest } from "fastify";
import { NotificationRepository } from "../repositories/notification.repository";

export const NotificationService = {
  async getUserNotifications(req: FastifyRequest) {
    const notificationRepo = new NotificationRepository(req.server.db);
    const userId = Number(req.headers["x-user-id"]);    
  },
};
