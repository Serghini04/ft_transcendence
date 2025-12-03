import { FastifyInstance } from "fastify";
import { NotificationService } from "../services/notification.service";

export async function notificationRoutes(app: FastifyInstance) {

  app.get("/notifications", async (req: any) => {
    const userId = req.headers["x-user-id"];
    return NotificationService.getUserNotifications(userId);
  });

  app.post("/notifications", async (req: any) => {
    const body = req.body;
    return NotificationService.createNotification(body);
  });

  app.patch("/notifications/:id/read", async (req) => {
    const id = Number(req.params.id);
    await NotificationService.markAsRead(id);
    return { success: true };
  });
}
