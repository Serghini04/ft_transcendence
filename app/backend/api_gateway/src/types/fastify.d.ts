import { Database } from "better-sqlite3";
import { Server } from "socket.io";
 
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }
}
