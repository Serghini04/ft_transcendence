import { Kafka, Producer } from "kafkajs";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "chat-service";

export interface NotificationEvent {
  userId: number;
  title: string;
  message: string;
  type: string;
  timestamp: string;
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
      console.log(`Notification event published for user ${event.userId}`);
    } catch (error) {
      console.error("Failed to publish notification event:", error);
    }
  }

  async publishNewMessageNotification(recipientId: number, senderName: string, messagePreview: string, timestamp: Date | string): Promise<void> {
    const event: NotificationEvent = {
      userId: recipientId,
      title: `New message from ${senderName}`,
      message: messagePreview.length > 50 
        ? messagePreview.substring(0, 50) + "..." 
        : messagePreview,
      type: "message",
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
    };

    console.log(`Publishing notification event:`, event);
    await this.publishNotification(event);
  }
}

export const kafkaProducerService = new KafkaProducerService();
