import type { FastifyReply, FastifyRequest } from "fastify";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import "fastify";

dotenv.config();

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }
}

interface UserPayload {
    id: number;
    name: string;
    email: string;
  }



export function generateJwtAccessToken({id, name, email}: {id: number; name:string; email: string}){
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const token = jwt.sign({ id: id, name: name, email: email }, process.env.JWT_SECRET, { expiresIn: "15m" })
    return token;
}

export function generateJwtRefreshToken({id, name, email}: {id: number; name:string; email: string}){
    if (!process.env.JWT_REFRESH) {
      throw new Error("JWT_REFRESH  is not defined");
    }
    const token = jwt.sign({ id: id, name: name, email: email }, process.env.JWT_REFRESH, { expiresIn: "7d" })
    return token;
}


export function verifyRefreshToken(token: string) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as UserPayload;
}

export async function authenticateToken(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return reply.status(401).send({ message: "No token provided", code: "NO_TOKEN" } );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload | string;
    if (typeof decoded === "string") {
        return reply.status(403).send({ message: "Invalid token format", code: "NO_TOKEN" });
    }
    req.user = decoded;
  } catch (err) {
    return reply.status(403).send({ message: "Invalid or expired token", code: "NO_TOKEN" });
  }
  return req.user;
}
