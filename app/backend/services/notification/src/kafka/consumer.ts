import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { NotificationRepository } from "../repositories/notification.repository";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import { userSockets } from "../plugins/socket";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "notification-service";
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || "notification-service-group";

export interface NotificationEvent {
  userId: number;
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;
  private db: Database.Database;
  private io: Server;

  constructor(db: Database.Database, io: Server) {
    this.db = db;
    this.io = io;
    
    this.kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: [KAFKA_BROKER],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({ groupId: KAFKA_GROUP_ID });
  }

  async connect(): Promise<void> {
    if (this.isConnected)
      return;

    try {
      console.log("Connecting Kafka consumer...");
      await this.consumer.connect();
      console.log("Subscribing to 'notifications' topic...");
      await this.consumer.subscribe({ topic: "notifications", fromBeginning: false });
      
      console.log("Starting consumer run...");
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          console.log("🎯 eachMessage handler called!");
          await this.handleMessage(payload);
        },
      });

      this.isConnected = true;
      console.log("Kafka consumer connected and listening to 'notifications' topic");
    } catch (error) {
      console.error("Failed to connect Kafka consumer:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log("Kafka consumer disconnected");
    } catch (error) {
      console.error("Failed to disconnect Kafka consumer:", error);
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message, topic, partition } = payload;
    
    try {
      console.log(`Kafka message received from topic: ${topic}, partition: ${partition}`);
      
      if (!message.value) {
        console.error("Received empty message value");
        return;
      }

      const eventData = JSON.parse(message.value.toString()) as NotificationEvent;
      console.log(`Event data:`, eventData);
      
      const notificationRepo = new NotificationRepository(this.db);
      const notification = notificationRepo.createNotification(
        eventData.userId,
        eventData.title,
        eventData.message,
        eventData.type
      );

      console.log(`Notification saved to database for user ${eventData.userId}`);

      const socketIds = userSockets.get(eventData.userId);
      
      if (eventData.type === 'challenge')
        console.log(`Challenge notification stored in DB for user ${eventData.userId}, skipping toast (handled by game socket)`);
      else if (socketIds && socketIds.size > 0) {
        const notificationNS = this.io.of("/notification");
        socketIds.forEach(socketId => {
          notificationNS.to(socketId).emit("notification:new", notification);
        });
        console.log(`Toast notification sent to online user ${eventData.userId} (${socketIds.size} socket(s))`);
      }
      else {
        console.log(`User ${eventData.userId} is offline, notification stored for later`);
      }
    } catch (error) {
      console.error("Failed to process notification event:", error);
      console.error("Message value:", message.value?.toString());
    }
  }
}
