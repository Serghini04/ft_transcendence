import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { initDatabase} from './db/database.js';


const fastify = Fastify();
await fastify.register(cors, { origin: "*" });

// Initialize database
initDatabase();

gameGateway(fastify);

await fastify.listen({ port: 8080 });
console.log("🚀 Game Service running on http://localhost:8080");