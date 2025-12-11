import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Server } from "socket.io";
import { gameGateway } from "../controllers/game.gateway";

async function gameSocket(fastify: FastifyInstance) {
  const io = new Server(fastify.server, {
    cors: { origin: "*" },
  });

  // Create /game namespace to match what the gateway expects
  const gameNamespace = io.of("/game");
  gameGateway(gameNamespace, fastify);
  
  fastify.decorate("io", io);
}

export default fp(gameSocket);
