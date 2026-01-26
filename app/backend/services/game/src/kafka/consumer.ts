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

interface RelationshipEvent {
  action: 'created' | 'updated' | 'deleted';
  user1_id: number;
  user2_id: number;
  type?: 'friend' | 'blocked' | 'pending';
  blocked_by_user_id?: number;
  timestamp: string;
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

  async connectWithRetry(maxRetries: number = 10, initialDelay: number = 2000): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.connect();
        console.log(`✅ Kafka connected successfully on attempt ${attempt}`);
        return;
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const delay = initialDelay * Math.pow(2, attempt - 1);
        
        console.log(
          `⚠️ Kafka connection attempt ${attempt}/${maxRetries} failed: ${error.message}`
        );
        
        if (isLastAttempt) {
          console.error('❌ Max Kafka connection retries reached. Service will continue without Kafka.');
          throw error;
        }
        
        console.log(`🔄 Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

      // Subscribe to relationships topic
      await this.consumer.subscribe({
        topic: 'relationships',
        fromBeginning: true,
      });

      console.log('✅ Subscribed to topics: UserCreated, userUpdated, relationships');
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

      console.log(`📥 Received event from topic '${topic}'`);

      // Handle different topics
      switch (topic) {
        case 'UserCreated':
          const userCreatedEvent: UserEvent = JSON.parse(value);
          await this.handleUserCreated(userCreatedEvent);
          break;
        case 'userUpdated':
          const userUpdatedEvent: UserEvent = JSON.parse(value);
          await this.handleUserUpdated(userUpdatedEvent);
          break;
        case 'relationships':
          const relationshipEvent: RelationshipEvent = JSON.parse(value);
          await this.handleRelationshipEvent(relationshipEvent);
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

  private async handleRelationshipEvent(event: RelationshipEvent): Promise<void> {
    try {
      console.log(`🔗 Processing relationship ${event.action}:`, {
        user1_id: event.user1_id,
        user2_id: event.user2_id,
        type: event.type,
      });

      switch (event.action) {
        case 'created':
          await this.handleRelationshipCreated(event);
          break;
        case 'updated':
          await this.handleRelationshipUpdated(event);
          break;
        case 'deleted':
          await this.handleRelationshipDeleted(event);
          break;
        default:
          console.warn(`⚠️ Unknown relationship action: ${event.action}`);
      }
    } catch (error) {
      console.error('❌ Failed to process relationship event:', error);
      throw error;
    }
  }

  private async handleRelationshipCreated(event: RelationshipEvent): Promise<void> {
    try {
      // Check if relationship already exists
      const existingRel = db.prepare(`
        SELECT id FROM relationships 
        WHERE user1_id = ? AND user2_id = ?
      `).get(event.user1_id.toString(), event.user2_id.toString());

      if (existingRel) {
        console.log(`ℹ️ Relationship already exists, updating instead`);
        await this.handleRelationshipUpdated(event);
        return;
      }

      // Insert new relationship
      const stmt = db.prepare(`
        INSERT INTO relationships (user1_id, user2_id, type, blocked_by_user_id)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        event.user1_id.toString(),
        event.user2_id.toString(),
        event.type || 'friend',
        event.blocked_by_user_id ? event.blocked_by_user_id.toString() : null
      );

      console.log(`✅ Relationship created successfully in game database`);
    } catch (error) {
      console.error('❌ Failed to create relationship:', error);
      throw error;
    }
  }

  private async handleRelationshipUpdated(event: RelationshipEvent): Promise<void> {
    try {
      // Update relationship
      const stmt = db.prepare(`
        UPDATE relationships 
        SET type = ?, blocked_by_user_id = ?
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `);

      const result = stmt.run(
        event.type || 'friend',
        event.blocked_by_user_id ? event.blocked_by_user_id.toString() : null,
        event.user1_id.toString(),
        event.user2_id.toString(),
        event.user2_id.toString(),
        event.user1_id.toString()
      );

      if (result.changes === 0) {
        console.log(`ℹ️ Relationship not found, creating instead`);
        await this.handleRelationshipCreated(event);
        return;
      }

      console.log(`✅ Relationship updated successfully in game database`);
    } catch (error) {
      console.error('❌ Failed to update relationship:', error);
      throw error;
    }
  }

  private async handleRelationshipDeleted(event: RelationshipEvent): Promise<void> {
    try {
      // Delete relationship
      const stmt = db.prepare(`
        DELETE FROM relationships 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `);

      const result = stmt.run(
        event.user1_id.toString(),
        event.user2_id.toString(),
        event.user2_id.toString(),
        event.user1_id.toString()
      );

      if (result.changes === 0) {
        console.log(`ℹ️ Relationship not found, nothing to delete`);
        return;
      }

      console.log(`✅ Relationship deleted successfully from game database`);
    } catch (error) {
      console.error('❌ Failed to delete relationship:', error);
      throw error;
    }
  }
}

export const kafkaConsumerService = new KafkaConsumerService();
