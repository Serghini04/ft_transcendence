import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import proxy from "@fastify/http-proxy";

export async function chatService(app: FastifyInstance) {
  app.log.info("Registering Chat Service proxy...");

  app.register(proxy, {
    upstream: "http://localhost:3003",
    prefix: "/api/v1/chat",
    rewritePrefix: "/api/v1/chat",
    
    preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
      req.headers["x-user-id"] = String(req.user?.id);
    },

    replyOptions: {
      onError(reply, error) {
        app.log.error(
          { err: error },
          "Chat Service is unavailable"
        );

        reply.status(503).send({
          code: "SERVICE_UNAVAILABLE",
          message:
            "Chat service is currently unavailable. Please try again later.",
        });
      },
    },

  });
}