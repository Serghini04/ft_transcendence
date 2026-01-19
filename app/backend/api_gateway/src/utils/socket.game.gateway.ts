import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Server } from "socket.io";
import { io as ClientIO } from "socket.io-client";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { parse as parseCookie } from "cookie";
import { generateJwtAccessToken } from "../middleware/auth.middleware";
import { secrets } from "../server";

export function setupGameSocketGateway(app: FastifyInstance) {
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
      let accessToken = socket.handshake.auth?.token;
      const rawCookies = socket.handshake.headers.cookie;
      const cookies = rawCookies ? parseCookie(rawCookies) : {};
      const refreshToken = cookies.refreshToken;

      if (!accessToken) {
        return next(new Error("NO_TOKEN"));
      }

      try {
        // Verify access token
        const decoded = jwt.verify(
          accessToken,
          secrets.JWT_SECRET!
        );

        socket.data.user = decoded;
        return next();

      } catch (err) {
        // Access token expired → use refresh
        if (err instanceof TokenExpiredError) {
          if (!refreshToken) return next(new Error("NO_REFRESH_TOKEN"));

          try {
            const decodedRefresh = jwt.verify(
              refreshToken,
              secrets.JWT_REFRESH!
            ) as any;

            const newAccessToken = generateJwtAccessToken({
              id: decodedRefresh.id,
              email: decodedRefresh.email,
              name: decodedRefresh.name,
            });

            socket.emit("token_refreshed", { accessToken: newAccessToken });

            socket.data.user = decodedRefresh;
            return next();

          } catch (refreshErr) {
            return next(new Error("REFRESH_INVALID"));
          }
        }

        return next(new Error("INVALID_ACCESS_TOKEN"));
      }
    } catch (error) {
      return next(new Error("AUTH_ERROR"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    if (!user) {
      app.log.error("No user data in socket");
      socket.disconnect();
      return;
    }

    app.log.info(`User ${user.id} connected via Gateway (${user.email})`);

    // Connect to chat microservice
    const gameSocket = ClientIO("http://localhost:3005", {
      path: "/socket.io",
      withCredentials: true,
      auth: { userId: user.id },
      transports: ["websocket", "polling"],
    //   reconnection: true,
    //   reconnectionAttempts: 5,
    //   reconnectionDelay: 1000,
    });

    gameSocket.on("connect", () => {
      app.log.info(`Connected to game service for user: ${user.id}`);
    });

    gameSocket.on("connect_error", (error) => {
      app.log.error({ err: error }, `game service connection error for user ${user.id}`);
      socket.emit("service_error", { message: "game service unavailable" });
    });

    gameSocket.on("disconnect", (reason) => {
      app.log.info(`game service disconnected for user ${user.id}: ${reason}`);
    });

    // Forward all events from client to chat service
    socket.onAny((event, ...args) => {
      gameSocket.emit(event, ...args);
    });

    // Forward all events from chat service to client
    gameSocket.onAny((event, ...args) => {
      socket.emit(event, ...args);
    });

    // Handle client disconnection
    socket.on("disconnect", (reason) => {
      app.log.info(`User ${user.id} disconnected: ${reason}`);
      gameSocket.removeAllListeners();
      gameSocket.disconnect();
    });

    // Handle errors
    socket.on("error", (error) => {
      app.log.error({ err: error }, `Socket error for user ${user.id}`);
    });
  });

  app.log.info("Socket.IO Gateway initialized on path /socket.io");
}