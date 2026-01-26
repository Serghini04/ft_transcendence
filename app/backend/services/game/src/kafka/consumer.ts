import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { db } from '../plugins/game.db';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'game-service';
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'game-service-group';

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
      console.log('✅ Kafka consumer connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect Kafka consumer:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('👋 Kafka consumer disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect Kafka consumer:', error);
    }
  }

  async subscribe(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consumer not connected. Call connect() first.');
    }

    try {
      // Subscribe to UserCreated topic
      await this.consumer.subscribe({
        topic: 'UserCreated',
        fromBeginning: true,
      });

      // Subscribe to userUpdated topic
      await this.consumer.subscribe({
        topic: 'userUpdated',
        fromBeginning: false,
      });

      console.log('✅ Subscribed to topics: UserCreated, userUpdated');
    } catch (error) {
      console.error('❌ Failed to subscribe to topics:', error);
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Consumer not connected. Call connect() first.');
    }

    try {
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      console.log('✅ Kafka consumer started successfully');
    } catch (error) {
      console.error('❌ Failed to start consuming messages:', error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const value = message.value?.toString();
      if (!value) {
        console.warn('⚠️ Received empty message');
        return;
      }

      const event: UserEvent = JSON.parse(value);
      console.log(`📥 Received event from topic '${topic}':`, {
        userId: event.userId,
        name: event.name,
      });

      // Handle different topics
      switch (topic) {
        case 'UserCreated':
          await this.handleUserCreated(event);
          break;
        case 'userUpdated':
          await this.handleUserUpdated(event);
          break;
        default:
          console.warn(`⚠️ Unknown topic: ${topic}`);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      // Don't throw - this would stop the consumer
      // Instead, log the error and continue processing other messages
    }
  }

  private async handleUserCreated(event: UserEvent): Promise<void> {
    try {
      console.log(`👤 Creating user in game database:`, {
        id: event.userId,
        name: event.name,
      });

      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(event.userId);

      if (existingUser) {
        console.log(`ℹ️ User ${event.userId} already exists, updating instead`);
        await this.handleUserUpdated(event);
        return;
      }

      // Insert new user
      const stmt = db.prepare(`
        INSERT INTO users (id, name, avatar, level, created_at, updated_at)
        VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      stmt.run(event.userId, event.name, event.photoURL || '');

      console.log(`✅ User ${event.userId} created successfully in game database`);
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      throw error;
    }
  }

  private async handleUserUpdated(event: UserEvent): Promise<void> {
    try {
      console.log(`🔄 Updating user in game database:`, {
        id: event.userId,
        name: event.name,
      });

      // Update user
      const stmt = db.prepare(`
        UPDATE users 
        SET name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(event.name, event.photoURL || '', event.userId);

      if (result.changes === 0) {
        console.log(`ℹ️ User ${event.userId} not found, creating instead`);
        await this.handleUserCreated(event);
        return;
      }

      console.log(`✅ User ${event.userId} updated successfully in game database`);
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      throw error;
    }
  }
}

export const kafkaConsumerService = new KafkaConsumerService();
