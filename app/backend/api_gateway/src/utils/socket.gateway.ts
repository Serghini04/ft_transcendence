import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { io as ClientIO } from "socket.io-client";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { parse as parseCookie } from "cookie";
import { generateJwtAccessToken } from "../middleware/auth.middleware";

export function setupSocketGateway(app: FastifyInstance) {
  const io = new Server(app.server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
    transports: ["polling", "websocket"],
  });

  const authMiddleware = async (socket: any, next: any) => {
    try {
      let accessToken = socket.handshake.auth?.token;

      const cookies = socket.handshake.headers.cookie
        ? parseCookie(socket.handshake.headers.cookie)
        : {};
      const refreshToken = cookies.refreshToken;

      if (!accessToken) return next(new Error("NO_TOKEN"));

      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!);
        socket.data.user = decoded;
        return next();
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          if (!refreshToken) return next(new Error("NO_REFRESH_TOKEN"));

          try {
            const decodedRefresh = jwt.verify(
              refreshToken,
              process.env.JWT_REFRESH!
            ) as any;

            const newAccessToken = generateJwtAccessToken({
              id: decodedRefresh.id,
              name: decodedRefresh.name,
              email: decodedRefresh.email,
            });

            socket.emit("token_refreshed", { accessToken: newAccessToken });
            socket.data.user = decodedRefresh;
            return next();
          } catch {
            return next(new Error("REFRESH_INVALID"));
          }
        }

        return next(new Error("INVALID_TOKEN"));
      }
    } catch (err) {
      return next(new Error("AUTH_ERROR"));
    }
  };

  const chatNamespace = io.of("/chat");
  
  chatNamespace.use(authMiddleware);

  chatNamespace.on("connection", (socket) => {
    const user = socket.data.user;

    app.log.info(`User ${user.id} connected to /chat namespace`);

    const chatSocket = ClientIO("http://localhost:3003/chat", {
      path: "/socket.io",
      withCredentials: true,
      auth: { userId: user.id },
      transports: ["websocket", "polling"],
    });

    socket.onAny((event, ...args) => {
      chatSocket.emit(event, ...args);
    });

    chatSocket.onAny((event, ...args) => {
      socket.emit(event, ...args);
    });

    socket.on("disconnect", () => chatSocket.disconnect());
  });

  const gameNamespace = io.of("/game");
  
  gameNamespace.use(authMiddleware);

  gameNamespace.on("connection", (socket) => {
    const user = socket.data.user;

    app.log.info(`User ${user.id} connected to /game namespace`);

    const gameSocket = ClientIO("http://localhost:3005/game", {
      path: "/socket.io",
      withCredentials: true,
      auth: { userId: user.id },
      transports: ["websocket"],
    });

    gameSocket.on("connect", () => app.log.info(`🔗 Game socket connected for user ${user.id}`));
    gameSocket.on("connect_error", (err) => app.log.error({ err }, `❌ Game socket connect_error for user ${user.id}`));
    gameSocket.on("error", (err) => app.log.error({ err }, `❌ Game socket error for user ${user.id}`));

    socket.onAny((event, ...args) => {
      app.log.info(`📤 [User ${user.id}] -> game event: ${String(event)}`);
      gameSocket.emit(event, ...args);
    });

    gameSocket.onAny((event, ...args) => {
      app.log.info(`📥 [game -> User ${user.id}] event: ${String(event)}`);
      socket.emit(event, ...args);
    });

    socket.on("disconnect", () => gameSocket.disconnect());
  });

  app.log.info("✅ Socket.IO Gateway initialized on path /socket.io");

  const notifNamespace = io.of("/notification");
  
  notifNamespace.use(authMiddleware);

  notifNamespace.on("connection", (socket) => {
    const user = socket.data.user;

    app.log.info(`User ${user.id} connected to /notification namespace`);

    const notificationSocket = ClientIO("http://localhost:3006/notification", {
      path: "/socket.io",
      withCredentials: true,
      auth: { userId: user.id },
      transports: ["websocket", "polling"],
    });

    socket.onAny((event, ...args) => {
      notificationSocket.emit(event, ...args);
    });

    notificationSocket.onAny((event, ...args) => {
      socket.emit(event, ...args);
    });

    socket.on("disconnect", () => notificationSocket.disconnect());
  });

  app.log.info("Gateway with namespaces initialized");
}
