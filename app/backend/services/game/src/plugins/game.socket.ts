import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Server } from "socket.io";
import { gameGateway } from "../controllers/game.gateway";

async function gameSocket(fastify: FastifyInstance) {
  const io = new Server(fastify.server, {
    cors: { origin: "*" },
  });

  gameGateway(io, fastify);
  fastify.decorate("io", io);
}

export default fp(gameSocket);
