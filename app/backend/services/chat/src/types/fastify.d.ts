import { Database } from "better-sqlite3";
 
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      userId: number;
      fullName: string;
    };
  }

  interface FastifyInstance {
    db: Database;
  }
}
