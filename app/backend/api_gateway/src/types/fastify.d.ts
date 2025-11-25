import { Database } from "better-sqlite3";
import { Server } from "socket.io";
 
declare module "fastify" {
  interface FastifyRequest {
    cookies: {
      [key: string]: string | undefined;
    };
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }
  interface UserPayload {
      id: number;
      name: string;
      email: string;
    }
}