import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

export async function chatService(app: FastifyInstance) {
  app.log.info("Registering Chat Service proxy...");

  app.register(proxy, {
    upstream: "http://localhost:3000",
    prefix: "/api/v1/chat",
    rewritePrefix: "/api/v1/chat",
    
    preHandler: async (req, _res) => {
      if (req.user) {
        req.headers["x-user-id"] = String(req.user.userId);
        req.headers["x-user-fullname"] = String(req.user.fullName);
      }
    },
  });
}
