import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

export async function NotificationService(app: FastifyInstance) {
  app.log.info("Registering Notification Service proxy...");

  app.register(proxy, {
    upstream: "http://notification-service:3006",
    prefix: "/api/v1/notifications",
    rewritePrefix: "/api/v1/notifications",

    preHandler: async (req) => {
      req.headers["x-user-id"] = String(req.user?.id);
    },

    replyOptions: {
      onError(reply, error) {
        app.log.error(
          { err: error },
          "Notification Service is unavailable"
        );

        reply.status(503).send({
          code: "SERVICE_UNAVAILABLE",
          message:
            "Notification service is currently unavailable. Please try again later.",
        });
      },
    },
  });
}
