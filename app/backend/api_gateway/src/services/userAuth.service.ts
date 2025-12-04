import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import proxy from "@fastify/http-proxy";

export async function userAuthService(app: FastifyInstance) {
  app.log.info("Registering User Auth Service proxy...");

  app.register(proxy, {
    upstream: "http://localhost:3004",
    prefix: "/api/v1/auth",
    rewritePrefix: "/api/v1/auth",
    
    preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        req.headers["x-user-id"] = String(req.id);
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

  // app.setErrorHandler((error, req, reply) => {
  //   if (error.code === "ECONNREFUSED") {
  //     app.log.error(`Error connecting to User Auth Service: ${error.message}`);
  //     reply.status(503).send({
  //       code: "SERVICE_UNAVAILABLE",
  //       message: "User Auth Service is currently unavailable. Please try again later.",
  //     });
  //   } else {
  //     app.log.error(`Unexpected error: ${error.message}`);
  //     reply.status(503).send({
  //       code: "SERVICE_UNAVAILABLE",
  //       message: "An unexpected error occurred.",
  //     });
  //   }
  // });
}