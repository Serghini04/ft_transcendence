import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import proxy from "@fastify/http-proxy";


export async function tictacService(app: FastifyInstance) {
  app.log.info("Registering TicTac Service proxy...");

  // Register proxy for tictac-specific routes (not /api/v1/*)
  app.register(async (instance) => {
    instance.register(proxy, {
      upstream: "http://tictac-game:3030",
      prefix: "/api",
      rewritePrefix: "/api",
      
      preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
        // Only proxy if route doesn't start with /api/v1/
        if (req.url.startsWith('/api/v1/')) {
          reply.callNotFound();
          return;
        }
        
        try {
          // Only set x-user-id if user exists (for authenticated routes)
          if (req.user?.id) {
            req.headers["x-user-id"] = String(req.user.id);
          }
          app.log.info(`TicTac proxy: ${req.method} ${req.url}`);
        } catch (error) {
          const err = error as Error;
          app.log.error(`Error in TicTac preHandler: ${err.message}`);
          reply.status(503).send({
            code: "SERVICE_UNAVAILABLE",
            message: "An error occurred while processing the request.",
          });
        }
      },
    });
  });
}
