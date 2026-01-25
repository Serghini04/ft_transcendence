import { fastify, UserPayload, type FastifyReply, type FastifyRequest } from "fastify";
import jwt, { TokenExpiredError, type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { secrets } from "../server";
import "fastify";

dotenv.config();

export function generateJwtAccessToken({id, name, email}: {id: number; name:string; email: string}){
    if (!secrets?.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const token = jwt.sign({ id: id, name: name, email: email }, secrets.JWT_SECRET, { expiresIn: "15m" })
    return token;
}

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  if (!req.url.startsWith("/api/v1/auth/protect") && !req.url.startsWith("/api/v1/auth/setting/") && req.url.startsWith("/api/v1/auth/")) {
    console.error("Auth route, skipping middleware");
    return;
  }
  if (req.url.startsWith("/socket.io/")) {
    return;
  }
  // Skip tictac game routes - they handle their own auth
  // if (req.url.startsWith("/api/") && !req.url.startsWith("/api/v1/")) {
  //   return;
  // }
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.split(" ")[1];

  if (!accessToken) {
    return reply.status(401).send({ code: "NO_TOKEN" });
  }

  try {
    
    const decoded = jwt.verify(accessToken, secrets.JWT_SECRET!) as UserPayload;
    req.user = decoded;
    return; // Access allowed
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
          secrets.JWT_REFRESH!
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