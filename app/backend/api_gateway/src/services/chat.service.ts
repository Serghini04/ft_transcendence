import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

export async function chatService(app: FastifyInstance) {
  app.log.info("Registering Chat Service proxy...");

  app.register(proxy, {
    upstream: "http://localhost:3003",
    prefix: "/api/v1/chat",
    rewritePrefix: "/api/v1/chat",
    
    preHandler: async (req, _res) => {
      req.headers["x-user-id"] = String(req.user?.id);
    },
  });
}
