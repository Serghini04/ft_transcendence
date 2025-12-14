import { FastifyInstance } from "fastify";
import { notificationController } from "../controllers/notification.controller";

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/", notificationController.getUserNotifications);
  app.patch("/read-all", notificationController.markAllAsRead);
  // app.post("");
  // app.get("/unread/count", notificationController.getUnreadNotificationsCount);
}
