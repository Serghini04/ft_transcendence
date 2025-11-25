import { setupSocketServer } from "./socket";
import { notificationRoutes } from "./routes/notification.routes";
import cors from "@fastify/cors";
import fastify from "fastify";

const buildApp = () => {
  const app = fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    },
  });

  app.register(cors, {
    origin: true,
  });

  app.register(notificationRoutes);

  return app;
};

const start = async () => {
  const app = buildApp();
  const PORT = Number(process.env.NOTIF_SERVICE_PORT ?? 3004);

  await app.listen({ port: PORT, host: "0.0.0.0" });

  setupSocketServer(app);

  console.log(`🚀 Notification Service running on port ${PORT}`);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});