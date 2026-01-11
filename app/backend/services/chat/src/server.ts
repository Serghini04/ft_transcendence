import Fastify from "fastify";
import cors from "@fastify/cors";
import { db } from "./plugins/chat.db";
import chatRoutes from "./routes/chat.route";
import socketPlugin from "./plugins/socket";
import { kafkaProducerService } from "./kafka/producer";
import { kafkaConsumerService } from "./kafka/consumer";


const app = Fastify({
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
app.register(socketPlugin);
app.register(chatRoutes, { prefix: "/api/v1/chat"});

const start = async () => {
  try {
    await app.listen({ port: 3003, host: '0.0.0.0' });
    app.log.info("Chat Service running at http://0.0.0.0:3003");
    
    // Connect Kafka producer with retry logic
    try {
      await kafkaProducerService.connect();
      app.log.info("Kafka producer connected successfully");
    } catch (error) {
      app.log.error({ err: error }, "Failed to connect Kafka producer, will retry in background");
      // Retry in background
      setTimeout(async () => {
        try {
          await kafkaProducerService.connect();
          app.log.info("Kafka producer reconnected successfully");
        } catch (retryError) {
          app.log.error({ err: retryError }, "Kafka producer retry failed");
        }
      }, 10000);
    }
    
    // Connect and start Kafka consumer with retry logic
    try {
      await kafkaConsumerService.connect();
      await kafkaConsumerService.subscribe();
      await kafkaConsumerService.startConsuming();
      app.log.info("Kafka consumer started successfully");
    } catch (error) {
      app.log.error({ err: error }, "Failed to start Kafka consumer, will retry in background");
      // Retry in background
      setTimeout(async () => {
        try {
          await kafkaConsumerService.connect();
          await kafkaConsumerService.subscribe();
          await kafkaConsumerService.startConsuming();
          app.log.info("Kafka consumer reconnected successfully");
        } catch (retryError) {
          app.log.error({ err: retryError }, "Kafka consumer retry failed");
        }
      }, 10000);
    }
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
