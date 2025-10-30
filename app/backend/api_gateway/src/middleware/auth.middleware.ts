import { FastifyReply, FastifyRequest } from "fastify";
import verifyToken from "../utils/verifyToken";

export default async function authMiddleware(req: FastifyRequest, res: FastifyReply) {
  try {
    // Uncomment this when JWT is ready
    /*
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.code(401).send({ error: "Missing Authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      res.code(401).send({ error: "Invalid token" });
      return;
    }
    req.user = decoded;
    */
    req.user = { userId: 1, fullName: "Mehdi Serghini" };
  } catch (err) {
    res.code(401).send({ error: "Unauthorized" });
  }
}
