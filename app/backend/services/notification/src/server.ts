import socketPlugin from "./plugins/socket";
import { notificationRoutes } from "./routes/notification.routes";
import cors from "@fastify/cors";
import fastify from "fastify";
import { db } from "./plugins/notification.db";
import { KafkaConsumerService } from "./kafka/consumer";

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
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-user-id"]
  });

  app.decorate("db", db);
  app.register(notificationRoutes, {prefix: "/api/v1/notifications"});
  app.register(socketPlugin);

  return app;
};

const start = async () => {
  const app = buildApp();
  const PORT = Number(process.env.NOTIF_SERVICE_PORT ?? 3005);
  
  // Start the server first to ensure socket.io is ready
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Notification Service running on port ${PORT}`);
  
  // Now connect Kafka consumer after socket.io is ready
  const kafkaConsumer = new KafkaConsumerService(app.db, app.io);
  await kafkaConsumer.connect();
  console.log("Kafka consumer initialized and listening to 'notifications' topic");
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});