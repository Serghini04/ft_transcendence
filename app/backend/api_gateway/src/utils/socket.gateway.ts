import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { io as ClientIO } from "socket.io-client";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { parse as parseCookie } from "cookie";
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
    try {
      let accessToken = socket.handshake.auth?.token as string | undefined;

      const rawCookies = socket.handshake.headers.cookie;
      const cookies = rawCookies ? parseCookie(rawCookies) : {};
      const refreshToken = cookies.refreshToken;

      app.log.info({
        hasAuthToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      }, "🔍 Socket auth attempt");

      if (!accessToken) {
        return next(new Error("NO_TOKEN"));
      }

      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
        socket.data.user = decoded;
        return next();
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          app.log.info("Access token expired - attempting refresh using cookie");

          if (!refreshToken) {
            app.log.warn("Refresh token missing");
            return next(new Error("NO_REFRESH_TOKEN"));
          }

          try {
            const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH!) as any;

            const newAccessToken = generateJwtAccessToken({
              id: decodedRefresh.id,
              name: decodedRefresh.name,
              email: decodedRefresh.email,
            });

            socket.emit("token_refreshed", { accessToken: newAccessToken });

            socket.data.user = decodedRefresh;
            app.log.info(`Access token refreshed for user ${decodedRefresh.id}`);
            return next();
          } catch (refreshErr) {
            app.log.warn({ err: refreshErr }, "Refresh token invalid/expired");
            return next(new Error("REFRESH_INVALID"));
          }
        }

        app.log.warn({ err }, "Access token verification failed");
        return next(new Error("INVALID_TOKEN"));
      }
    } catch (err) {
      app.log.error({ err }, "Unexpected socket auth error");
      return next(new Error("AUTH_ERROR"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (!user) {
      socket.emit("service_error", { message: "Authentication failed" });
      socket.disconnect(true);
      return;
    }

    app.log.info(`🔌 User ${user.id} connected via Gateway`);

    const chatSocket = ClientIO("http://localhost:3003", {
      path: "/socket.io",
      withCredentials: true,
      auth: { userId: user.id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    chatSocket.on("connect", () => app.log.info(`Connected to chat service for user ${user.id}`));
    chatSocket.on("connect_error", (error) => {
      app.log.error({ err: error }, `Chat service connect error for user ${user.id}`);
      socket.emit("service_error", { message: "Chat service unavailable" });
    });
    chatSocket.on("disconnect", (reason) => app.log.info(`Chat service disconnected for user ${user.id}: ${reason}`));

    socket.onAny((event, ...args) => chatSocket.emit(event, ...args));

    chatSocket.onAny((event, ...args) => socket.emit(event, ...args));

    socket.on("disconnect", (reason) => {
      app.log.info(`User ${user.id} disconnected: ${reason}`);
      chatSocket.removeAllListeners();
      chatSocket.disconnect();
    });

    socket.on("error", (err) => {
      app.log.error({ err }, `Socket error for user ${user.id}`);
    });
  });

  app.log.info("Socket.IO Gateway initialized (path: /socket.io)");
}
