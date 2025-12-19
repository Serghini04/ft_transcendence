import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import proxy from "@fastify/http-proxy";

export async function gameService(app: FastifyInstance) {
  app.log.info("Registering User Auth Service proxy...");

  app.register(proxy, {
    upstream: "http://localhost:3005",
    prefix: "/api/v1/game",
    rewritePrefix: "/api/v1/game",
    
    preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
      req.headers["x-user-id"] = String(req.user?.id);
    },

    replyOptions: {
      onError(reply, error) {
        app.log.error(
          { err: error },
          "Game Service is unavailable"
        );

        reply.status(503).send({
          code: "SERVICE_UNAVAILABLE",
          message:
            "Game service is currently unavailable. Please try again later.",
        });
      },
    },
  });
}