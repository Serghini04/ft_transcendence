import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import proxy from "@fastify/http-proxy";

export async function userAuthService(app: FastifyInstance) {
  app.log.info("Registering User Auth Service proxy...");

  app.register(proxy, {
    upstream: "http://localhost:3004",
    prefix: "/api/v1/auth",
    rewritePrefix: "/api/v1/auth",
    http2: false,
    
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => {
        if (originalReq.headers.authorization)
          headers.authorization = originalReq.headers.authorization;
        return headers;
      },
      onError(reply, error) {
        app.log.error(
          { err: error },
          "UserAuth Service is unavailable"
        );

        reply.status(503).send({
          code: "SERVICE_UNAVAILABLE",
          message:
            "UserAuth service is currently unavailable. Please try again later.",
        });
      },
    },
    
    preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
        req.headers["x-user-id"] = String(req.id);
    },
  });
}