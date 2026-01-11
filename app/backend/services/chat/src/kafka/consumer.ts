import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { db } from "../plugins/chat.db";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "chat-service";
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || "chat-service-group";

interface UserEvent {
  userId: string;
  name: string;
  email: string;
  photoURL: string;
  bgPhotoURL: string;
  bio: string;
  profileVisibility: boolean;
  showNotifications: boolean;
}

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
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

    this.consumer = this.kafka.consumer({ groupId: KAFKA_GROUP_ID });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log("✅ Kafka consumer connected successfully");
    } catch (error) {
      console.error("❌ Failed to connect Kafka consumer:", error);
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

  async subscribe(): Promise<void> {
    try {
      await this.consumer.subscribe({ topics: ["UserCreated", "userUpdated"], fromBeginning: true });
      console.log("📬 Subscribed to topics: UserCreated, userUpdated");
    } catch (error) {
      console.error("❌ Failed to subscribe to topics:", error);
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const value = message.value?.toString();
            if (!value) return;

            const event: UserEvent = JSON.parse(value);
            console.log(`📥 Received event from topic '${topic}':`, event);

            if (topic === "UserCreated") {
              await this.handleUserCreated(event);
            } else if (topic === "userUpdated") {
              await this.handleUserUpdated(event);
            }
          } catch (error) {
            console.error(`❌ Error processing message from topic '${topic}':`, error);
          }
        },
      });

      console.log("🎧 Kafka consumer is now listening for events...");
    } catch (error) {
      console.error("❌ Failed to start consuming messages:", error);
      throw error;
    }
  }

  private async handleUserCreated(event: UserEvent): Promise<void> {
    try {
      console.log(`🆕 Handling UserCreated event for user ${event.userId}`);

      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (id, full_name, avatar_url, bg_photo_url, bio, profileVisibility, showNotifications)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertUser.run(
        parseInt(event.userId),
        event.name,
        event.photoURL || null,
        event.bgPhotoURL || null,
        event.bio || '',
        event.profileVisibility ? 1 : 0,
        event.showNotifications ? 1 : 0
      );

      if (result.changes > 0) {
        console.log(`✅ User ${event.userId} created in chat database`);
      } else {
        console.log(`ℹ️  User ${event.userId} already exists in chat database`);
      }
    } catch (error) {
      console.error(`❌ Failed to handle UserCreated event:`, error);
      throw error;
    }
  }

  private async handleUserUpdated(event: UserEvent): Promise<void> {
    try {
      console.log(`🔄 Handling UserUpdated event for user ${event.userId}`);

      const updateUser = db.prepare(`
        UPDATE users
        SET full_name = ?,
            avatar_url = ?,
            bg_photo_url = ?,
            bio = ?,
            profileVisibility = ?,
            showNotifications = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = updateUser.run(
        event.name,
        event.photoURL || null,
        event.bgPhotoURL || null,
        event.bio || '',
        event.profileVisibility ? 1 : 0,
        event.showNotifications ? 1 : 0,
        parseInt(event.userId)
      );

      if (result.changes > 0) {
        console.log(`✅ User ${event.userId} updated in chat database`);
      } else {
        console.log(`⚠️  User ${event.userId} not found in chat database, creating new record`);
        // If user doesn't exist, create it
        await this.handleUserCreated(event);
      }
    } catch (error) {
      console.error(`❌ Failed to handle UserUpdated event:`, error);
      throw error;
    }
  }
}

export const kafkaConsumerService = new KafkaConsumerService();
