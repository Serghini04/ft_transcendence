import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

export async function userAuthService(app: FastifyInstance) {
  app.log.info("Registering Chat Service proxy...");

  app.register(proxy, {
    upstream: "http://localhost:3004",
    prefix: "/api/v1/auth",
    rewritePrefix: "/api/v1/auth",
    
    preHandler: async (req, _res) => {
      req.headers["x-user-id"] = String(req.id);
    },
  });
}
