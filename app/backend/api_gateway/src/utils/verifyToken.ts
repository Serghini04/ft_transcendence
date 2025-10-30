const SECRET = "TEST";
import jwt from "jsonwebtoken";

export default function verifyToken(token: string) {
    try {
        return jwt.verify(token, SECRET) as {userId: number};
    } catch {
        return null;
    }
}