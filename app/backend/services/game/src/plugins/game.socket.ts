import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Server } from "socket.io";
import { gameGateway } from "../controllers/game.gateway";

// Export namespace for access from routes
export let gameNamespace: any = null;
export let userSocketMap: Map<number, any> = new Map();
export let pendingChallenges: Map<string, any> = new Map();

async function gameSocket(fastify: FastifyInstance) {
  const io = new Server(fastify.server, {
    cors: { origin: "*" },
    pingTimeout: 30000,       // 30 seconds - how long to wait for pong response
    pingInterval: 25000,      // 25 seconds - how often to send ping
    connectTimeout: 45000,    // 45 seconds - connection timeout
    transports: ['websocket', 'polling'],
  });

  // Create /game namespace to match what the gateway expects
  gameNamespace = io.of("/game");
  gameGateway(gameNamespace, fastify);
  
  fastify.decorate("io", io);
  fastify.decorate("gameNamespace", gameNamespace);
}

export default fp(gameSocket);
