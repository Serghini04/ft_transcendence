import { FastifyRequest, FastifyReply } from "fastify";
import { NotificationRepository } from "../repositories/notification.repository";

async function getUserNotifications(req: FastifyRequest, res: FastifyReply) {
  const notificationRepo = new NotificationRepository(req.server.db);
  const userId = req.headers["x-user-id"] as string;

  req.log.info(`Getting notifications for user: ${userId}`);

  const notifications = await notificationRepo.getUserNotifications(userId);
  
  req.log.info(`Found ${notifications.length} notifications for user ${userId}`);

  return res.code(200).send(notifications);
}

async function markAllAsRead(req: FastifyRequest, res: FastifyReply) {
  const notificationRepo = new NotificationRepository(req.server.db);
  const userId = String(req.headers["x-user-id"]);

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
  const userId = String(req.headers["x-user-id"]);

  const count = await notificationRepo.getUnreadCount(userId);

  return res.code(200).send({
    unread: count
  });
}

async function createNotification(
  req: FastifyRequest<{
    Body: {
      userId: string;
      title: string;
      message: string;
      type: string;
      metadata?: any;
    };
  }>,
  res: FastifyReply
) {
  const { userId, title, message, type, metadata } = req.body;

  req.log.info(`Creating notification for user: ${userId}, title: ${title}`);

  if (!userId || !title || !message || !type) {
    return res.code(400).send({
      error: "Missing required fields: userId, title, message, type",
    });
  }

  try {
    const notificationRepo = new NotificationRepository(req.server.db);
    const notification = notificationRepo.createNotification(
      userId,
      title,
      message,
      type,
      metadata
    );

    req.log.info(`Notification created successfully: ID=${notification.id}, userId=${notification.userId}`);

    // Send real-time notification via Socket.IO
    if (req.server.io) {
      const notificationNS = req.server.io.of("/notification");
      const userIdNum = Number(userId);
      
      // Import userSockets to check if user is online
      const { userSockets } = await import("../plugins/socket");
      const userSocketIds = userSockets.get(userIdNum);
      
      if (userSocketIds && userSocketIds.size > 0) {
        // User is online - emit to their socket(s)
        userSocketIds.forEach(socketId => {
          notificationNS.to(socketId).emit("notification:new", notification);
        });
        req.log.info(`Real-time notification sent to user ${userId} (${userSocketIds.size} socket(s))`);
      } else {
        req.log.info(`User ${userId} is offline - notification stored for later retrieval`);
      }
    }

    return res.code(201).send(notification);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.log.error(`Error creating notification: ${errorMessage}`);
    return res.code(500).send({ error: "Failed to create notification" });
  }
}

async function updateNotificationMetadata(
  req: any,
  res: FastifyReply
) {
  const { userId, invitationId, status } = req.body as {
    userId: string;
    invitationId: number;
    status: string;
  };

  req.log.info(`Received update-metadata request: userId=${userId}, invitationId=${invitationId}, status=${status}`);

  if (!userId || !invitationId || !status) {
    return res.code(400).send({
      error: "Missing required fields: userId, invitationId, status",
    });
  }

  try {
    const notificationRepo = new NotificationRepository(req.server.db);
    const updated = notificationRepo.updateNotificationMetadata(userId, invitationId, status);

    req.log.info(`Update result: ${updated ? 'SUCCESS' : 'NO ROWS UPDATED'}`);

    if (updated) {
      req.log.info(`Updated notification metadata for invitation ${invitationId} to status: ${status}`);
      
      // Emit update via Socket.IO
      if (req.server.io) {
        const notificationNS = req.server.io.of("/notification");
        const userIdNum = Number(userId);
        
        const { userSockets } = await import("../plugins/socket");
        const userSocketIds = userSockets.get(userIdNum);
        
        if (userSocketIds && userSocketIds.size > 0) {
          userSocketIds.forEach(socketId => {
            notificationNS.to(socketId).emit("notification:updated", {
              invitationId,
              status
            });
          });
        }
      }
    }

    return res.code(200).send({ success: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.log.error(`Error updating notification metadata: ${errorMessage}`);
    return res.code(500).send({ error: "Failed to update notification metadata" });
  }
}

export const notificationController = {
  getUserNotifications,
  markAllAsRead,
  getUnreadNotificationsCount,
  createNotification,
  updateNotificationMetadata,
};
