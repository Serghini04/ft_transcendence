import { Kafka, Producer } from "kafkajs";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "game-service";

export interface NotificationEvent {
  userId: number;
  title: string;
  message: string;
  type: string;
  timestamp: string;
  showNotifications?: boolean;
}

export class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: [KAFKA_BROKER],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (this.isConnected)
      return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log("Kafka producer connected successfully");
    } catch (error) {
      console.error("Failed to connect Kafka producer:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected)
      return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log("Kafka producer disconnected");
    } catch (error) {
      console.error("Failed to disconnect Kafka producer:", error);
    }
  }

  async publishNotification(event: NotificationEvent): Promise<void> {
    if (!this.isConnected)
      return;

    try {
      await this.producer.send({
        topic: "notifications",
        messages: [
          {
            key: event.userId.toString(),
            value: JSON.stringify(event),
            headers: {
              "event-type": "notification.create",
            },
          },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  async publishChallengeNotification(
    recipientId: number,
    challengerName: string,
    challengeId: string,
    timestamp: Date | string
  ): Promise<void> {
    const event: NotificationEvent = {
      userId: recipientId,
      title: "Game Challenge Received",
      message: `${challengerName} challenged you to a game!`,
      type: "challenge",
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
    };
    await this.publishNotification(event);
  }
}

export const kafkaProducerService = new KafkaProducerService();
