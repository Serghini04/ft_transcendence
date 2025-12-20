import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import proxy from "@fastify/http-proxy";

export async function NotificationService(app: FastifyInstance) {
  app.log.info("Registering Chat Service proxy...");

  app.register(proxy, {
    upstream: "http://notification-service:3006",
    prefix: "/api/v1/notifications",
    rewritePrefix: "/api/v1/notifications",
    
    preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        req.headers["x-user-id"] = String(req.user?.id);
      } catch (error) {
        const err = error as Error;
        app.log.error(`Error in preHandler: ${err.message}`);
        reply.status(503).send({
          code: "SERVICE_UNAVAILABLE",
          message: "An error occurred while processing the request.",
        });
      }
    },
  });

  // app.setErrorHandler((error: Error, req: FastifyRequest, reply: FastifyReply) => {
  //   if (error.message.includes("ECONNREFUSED")) {
  //     app.log.error(`Error connecting to Chat Service: ${error.message}`);
  //     reply.status(503).send({
  //       code: "SERVICE_UNAVAILABLE",
  //       message: "Chat Service is currently unavailable. Please try again later.",
  //     });
  //   } else {
  //     reply.status(503).send({
  //       code: "SERVICE_UNAVAILABLE",
  //       message: "An unexpected error occurred.",
  //     });
  //   }
  // });
}