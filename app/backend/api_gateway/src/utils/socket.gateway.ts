import { FastifyInstance, UserPayload } from "fastify";
import { Server } from "socket.io";
import { io as ClientIO } from "socket.io-client";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { parse as parseCookie } from "cookie"; // ✅ Named import
import { generateJwtAccessToken } from "../middleware/auth.middleware";
import { console } from "inspector";

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
      // 1. First priority: Get access token from auth object (sent by frontend)
      let accessToken = socket.handshake.auth?.token;
      console.error("------------------------------> TEST", accessToken);
      
      // 2. Fallback: Check cookies for refresh token
      const rawCookies = socket.handshake.headers.cookie;
      const cookies = rawCookies ? parseCookie(rawCookies) : {}; // ✅ Use parseCookie
      const refreshToken = cookies.refreshToken;
      console.error("####------------------------------###> TEST REFRESH", refreshToken);

      app.log.info({
        hasAuthToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        authObject: socket.handshake.auth
      }, "🔍 Auth attempt");

      if (!accessToken) {
        app.log.warn("❌ No access token provided in auth object");
        return next(new Error("NO_TOKEN"));
      }

      try {
        // Verify access token
        const decoded = jwt.verify(
          accessToken,
          process.env.JWT_SECRET!
        ) as UserPayload;

        socket.data.user = decoded;
        app.log.info(`✅ Socket authenticated for user: ${decoded.id} (${decoded.email})`);
        return next();
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          app.log.info("⏰ Access token expired, attempting refresh");

          if (!refreshToken) {
            app.log.warn("❌ No refresh token available in cookies");
            return next(new Error("NO_REFRESH_TOKEN"));
          }

          try {
            // Verify refresh token
            const decodedRefresh = jwt.verify(
              refreshToken,
              process.env.JWT_REFRESH!
            ) as UserPayload;

            // Generate new access token
            const newAccessToken = generateJwtAccessToken({
              id: decodedRefresh.id,
              name: decodedRefresh.name,
              email: decodedRefresh.email,
            });

            app.log.info(`🔄 Generated new access token for user: ${decodedRefresh.id}`);

            // Send new token to client BEFORE connection completes
            socket.emit("token_refreshed", {
              accessToken: newAccessToken,
            });

            // Set user data and allow connection
            socket.data.user = decodedRefresh;
            return next();
          } catch (refreshErr) {
            app.log.error({ err: refreshErr }, "❌ Refresh token invalid");
            return next(new Error("REFRESH_INVALID"));
          }
        }

        app.log.error({ err }, "❌ Token verification failed");
        return next(new Error("INVALID_TOKEN"));
      }
    } catch (error) {
      app.log.error({ err: error }, "❌ Socket authentication error");
      return next(new Error("AUTH_ERROR"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    if (!user) {
      app.log.error("❌ No user data in socket");
      socket.disconnect();
      return;
    }

    app.log.info(`🔌 User ${user.id} connected via Gateway (${user.email})`);

    // Connect to chat microservice
    const chatSocket = ClientIO("http://localhost:3003", {
      path: "/socket.io",
      withCredentials: true,
      auth: { userId: user.id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    chatSocket.on("connect", () => {
      app.log.info(`✅ Connected to chat service for user: ${user.id}`);
    });

    chatSocket.on("connect_error", (error) => {
      app.log.error({ err: error }, `❌ Chat service connection error for user ${user.id}`);
      socket.emit("service_error", { message: "Chat service unavailable" });
    });

    chatSocket.on("disconnect", (reason) => {
      app.log.info(`❌ Chat service disconnected for user ${user.id}: ${reason}`);
    });

    // Forward all events from client to chat service
    socket.onAny((event, ...args) => {
      app.log.debug(`📤 [User ${user.id}] Forwarding to chat: ${event}`);
      chatSocket.emit(event, ...args);
    });

    // Forward all events from chat service to client
    chatSocket.onAny((event, ...args) => {
      app.log.debug(`📥 [User ${user.id}] Forwarding to client: ${event}`);
      socket.emit(event, ...args);
    });

    // Handle client disconnection
    socket.on("disconnect", (reason) => {
      app.log.info(`❌ User ${user.id} disconnected: ${reason}`);
      chatSocket.removeAllListeners();
      chatSocket.disconnect();
    });

    // Handle errors
    socket.on("error", (error) => {
      app.log.error({ err: error }, `❌ Socket error for user ${user.id}`);
    });
  });

  app.log.info("✅ Socket.IO Gateway initialized on path /socket.io");
}