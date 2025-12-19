import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import proxy from "@fastify/http-proxy";

export async function tictacService(app: FastifyInstance) {
  app.log.info("Registering TicTac Service proxy...");

  app.register(proxy, {
    upstream: "http://tictac-game:3030",
    prefix: "/api",
    rewritePrefix: "/api",
    
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
}
