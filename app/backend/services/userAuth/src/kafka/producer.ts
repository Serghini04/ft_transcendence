import { Kafka, Producer } from "kafkajs";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "user-service";

export interface UserEvent {
  userId: string;
  name: string;
  email: string;
  photoURL: string;
  bgPhotoURL: string;
  bio: string;
  profileVisibility: boolean;
  showNotifications: boolean;
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


  async publishUserCreated(event: UserEvent): Promise<void> {
    if (!this.isConnected) {
      console.error("❌ Cannot publish event: Producer not connected");
      return;
    }

    try {
      console.log("📤 Publishing event to Kafka topic 'UserCreated':", event);
      await this.producer.send({
        topic: "UserCreated",
        messages: [
          {
            key: event.userId.toString(),
            value: JSON.stringify(event),
            headers: {
              "event-type": "user-created",
            },
          },
        ],
      });
      console.log(`✅ UserCreated event published successfully for user ${event.userId}`);
    } catch (error) {
      console.error("❌ Failed to publish UserCreated event:", error);
      throw error;
    }
  } 

  async publishUserUpdated(event: UserEvent): Promise<void> {
    if (!this.isConnected) {
      console.error("❌ Cannot publish event: Producer not connected");
      return;
    }

    try {
      console.log("📤 Publishing event to Kafka topic 'UserUpdated':", event);
      await this.producer.send({
        topic: "userUpdated",
        messages: [
          {
            key: event.userId.toString(),
            value: JSON.stringify(event),
            headers: {
              "event-type": "user-updated",
            },
          },
        ],
      });
      console.log(`✅ UserUpdated event published successfully for user ${event.userId}`);
    } catch (error) {
      console.error("❌ Failed to publish UserUpdated event:", error);
      throw error;
    }
  }
}
  
//   async publishNewMessageNotification(recipientId: number, senderName: string, messagePreview: string, timestamp: Date | string): Promise<void> {
//     const event: NotificationEvent = {
//       userId: recipientId,
//       title: `New message from ${senderName}`,
//       message: messagePreview.length > 50 
//         ? messagePreview.substring(0, 50) + "..." 
//         : messagePreview,
//       type: "message",
//       timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
//     };

//     console.log(`Publishing notification event:`, event);
//     await this.publishNotification(event);
//   }
// }

export const kafkaProducerService = new KafkaProducerService();
