import { fastify, type FastifyReply, type FastifyRequest } from "fastify";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import cookie from "@fastify/cookie";
import "fastify";
import cors from "@fastify/cors";

dotenv.config();

declare module "fastify" {
  interface FastifyRequest {
    cookies: {
      [key: string]: string | undefined; // Allow undefined values for cookies
    };
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


export default async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  if (req.url.startsWith("/socket.io") || req.url.startsWith("/api/v1/auth")) {
    return;
  }
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.split(" ")[1];

  console.log("Auth Middleware - Access Token:", accessToken);
  if (!accessToken) {
    return reply.status(401).send({ code: "NO_TOKEN" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as UserPayload;
    req.user = decoded;
    req.headers["x-user-id"] = req.user.id.toString();
    return;
  } catch (err) {
    // Access Token expired → we check refresh token
    if (err instanceof jwt.TokenExpiredError) {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return reply.status(401).send({ code: "NO_REFRESH_TOKEN" });
      }

      try {
        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH!
        ) as UserPayload;

        const newAccessToken = generateJwtAccessToken({
          id: decodedRefresh.id,
          name: decodedRefresh.name,
          email: decodedRefresh.email
        });

        return reply.send({
          code: "TOKEN_REFRESHED",
          accessToken: newAccessToken
        });

      } catch {
        return reply.status(403).send({ code: "REFRESH_INVALID" });
      }
    }
    return reply.status(403).send({ code: "INVALID_ACCESS_TOKEN" });
  }
}
