import { fastify, UserPayload, type FastifyReply, type FastifyRequest } from "fastify";
import jwt, { TokenExpiredError, type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import cookie from "@fastify/cookie";
import "fastify";
import cors from "@fastify/cors";

dotenv.config();

export function generateJwtAccessToken({id, name, email}: {id: number; name:string; email: string}){
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const token = jwt.sign({ id: id, name: name, email: email }, process.env.JWT_SECRET, { expiresIn: "15s" }) // ✅ Changed from 15s to 15m
    return token;
}


export default async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (req.url.startsWith("/api/v1/auth")) return;
    if (req.url.startsWith("/socket.io")) return;
    
    const authHeader = req.headers.authorization;
    
    const accessToken = authHeader?.split(" ")[1];
    
    console.log("------------------------------> TEST AUTH MIDDLEWARE NO TOKEN: ", accessToken);
    if (!accessToken) {
      return reply.status(401).send({
        code: "NO_TOKEN",
        message: "Access token is missing",
      });
    }
    
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET as string
    ) as UserPayload;
    
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    };

    req.headers["x-user-id"] = String(decoded.id);
  } catch (err) {
    console.error("+++++++++++++++++++++++++ ERROR AUTH MIDDLEWARE: ", err);
    if (err instanceof TokenExpiredError) {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({
          code: "NO_REFRESH_TOKEN",
          message: "Refresh token is missing",
        });
      }

      try {
        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH as string
        ) as UserPayload;

        const newAccessToken = generateJwtAccessToken({
          id: decodedRefresh.id,
          name: decodedRefresh.name,
          email: decodedRefresh.email,
        });
        req.user = {
          id: decodedRefresh.id,
          name: decodedRefresh.name,
          email: decodedRefresh.email,
        };

        return reply.send({
          code: "TOKEN_REFRESHED",
          accessToken: newAccessToken,
        });
      } catch {
        return reply.status(403).send({
          code: "REFRESH_INVALID",
          message: "Refresh token is invalid",
        });
      }
    }

    return reply.status(403).send({
      code: "INVALID_ACCESS_TOKEN",
      message: "Access token is invalid",
    });
  }
}