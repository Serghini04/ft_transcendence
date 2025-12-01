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
    const token = jwt.sign({ id: id, name: name, email: email }, process.env.JWT_SECRET, { expiresIn: "10h" })
    return token;
}

export function generateJwtRefreshToken({id, name, email}: {id: number; name:string; email: string}){
  if (!process.env.JWT_REFRESH) {
    throw new Error("JWT_REFRESH is not defined");
  }
  const token = jwt.sign({ id: id, name: name, email: email }, process.env.JWT_REFRESH, { expiresIn: "25h" })
  return token;
}


export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH!) as UserPayload;
}

// export async function authenticateToken(req: FastifyRequest, reply: FastifyReply) {
//   const authHeader = req.headers.authorization;
//   const accessToken = authHeader?.split(" ")[1];

//   if (!accessToken) {
//     return reply.status(401).send({ code: "NO_TOKEN" });
//   }

//   try {
//     const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as UserPayload;
//     req.user = decoded;
//     return; // Access allowed
//   } catch (err) {
//     // Access Token expired → we check refresh token
//     if (err instanceof jwt.TokenExpiredError) {
//       const refreshToken = req.cookies.refreshToken;
//       if (!refreshToken) {
//         return reply.status(401).send({ code: "NO_REFRESH_TOKEN" });
//       }

//       try {
//         const decodedRefresh = jwt.verify(
//           refreshToken,
//           process.env.JWT_REFRESH!
//         ) as UserPayload;

//         const newAccessToken = generateJwtAccessToken({
//           id: decodedRefresh.id,
//           name: decodedRefresh.name,
//           email: decodedRefresh.email
//         });

//         return reply.send({
//           code: "TOKEN_REFRESHED",
//           accessToken: newAccessToken
//         });

//       } catch {
//         return reply.status(403).send({ code: "REFRESH_INVALID" });
//       }
//     }

//     return reply.status(403).send({ code: "INVALID_ACCESS_TOKEN" });
//   }
// }
