import { FastifyInstance, UserPayload } from "fastify";
import { Server } from "socket.io";
import { io as ClientIO } from "socket.io-client";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import cookie from "cookie";
import { generateJwtAccessToken } from "../middleware/auth.middleware";

export function setupSocketGateway(app: FastifyInstance) {
  const io = new Server(app.server, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  io.use(async (socket, next) => {
    const rawCookies = socket.handshake.headers.cookie;
    const cookies = rawCookies ? cookie.parse(rawCookies) : {};

    const accessToken = cookies.accessToken;
    const refreshToken = cookies.refreshToken;

    if (!accessToken) {
      return next(new Error("NO_TOKEN"));
    }

    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET!
      ) as UserPayload;

      socket.data.user = decoded;
      return next();
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        if (!refreshToken) {
          return next(new Error("NO_REFRESH_TOKEN"));
        }

        try {
          const decodedRefresh = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH!
          ) as UserPayload;

          const newAccessToken = generateJwtAccessToken({
            id: decodedRefresh.id,
            name: decodedRefresh.name,
            email: decodedRefresh.email,
          });

          socket.emit("token_refreshed", {
            accessToken: newAccessToken,
          });

          socket.data.user = decodedRefresh;
          return next();
        } catch {
          return next(new Error("REFRESH_INVALID"));
        }
      }

      return next(new Error("INVALID_TOKEN"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    app.log.info(`🔌 User connected via Gateway: ${user.id}`);

    const chatSocket = ClientIO("http://localhost:3003", {
      path: "/socket.io",
      withCredentials: true,
      auth: { userId: user.id },
      transports: ["polling", "websocket"],
    });

    socket.onAny((event, data) => chatSocket.emit(event, data));
    chatSocket.onAny((event, data) => socket.emit(event, data));

    socket.on("disconnect", () => {
      app.log.info(`❌ User ${user.id} disconnected`);
      chatSocket.disconnect();
    });
  });

  app.log.info("✅ Socket.IO Gateway initialized");
}
