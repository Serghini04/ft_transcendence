import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { UserModel } from "../models/user.model.js";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "tictac-service";
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || "tictac-service-group";

export interface UserCreatedEvent {
  userId: string;
  name: string;
  email?: string;
  createdAt: string;
}

export interface UserUpdatedEvent {
  userId: string;
  name?: string;
  email?: string;
  updatedAt: string;
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
    if (this.isConnected)
      return;

    try {

      console.log("Connecting Kafka consumer...");
      await this.consumer.connect();
      
      console.log("Subscribing to 'UserCreated' 'userUpdated' topic...");
      await this.consumer.subscribe({ 
        topic: "UserCreated", 
        fromBeginning: false
      });
      await this.consumer.subscribe({ 
        topic: "userUpdated", 
        fromBeginning: false
      });
      
      console.log("Starting consumer run...");
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isConnected = true;
      console.log("Kafka consumer connected and listening to topics: userCreated, userUpdated");
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
        console.error("Received empty message value!");
        return;
      }

      const event = JSON.parse(message.value.toString());
      
      if (!event || typeof event !== 'object' || !event.userId) {
        console.error(`Invalid event structure from topic ${topic}:`, event);
        return;
      }
      
      console.log(`Processing event from ${topic}:`, event);
      
      switch (topic) {
        case "UserCreated":
          await this.handleUserCreated(event as UserCreatedEvent);
          break;
        case "userUpdated":
          await this.handleUserUpdated(event as UserUpdatedEvent);
          break;
        default:
          console.warn(`Unknown topic: ${topic}`);
      }
    } catch (error) {
      console.error("Error handling Kafka message:", error);
    }
  }

  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    try {
      const { userId, name } = event;
      
      if (!name) {
        console.error(`Cannot create user ${userId}: missing username`);
        return;
      }
      
      const existingUser = UserModel.findById(userId);
      if (existingUser) {
        console.log(`User ${userId} already exists, skipping creation`);
        return;
      }

      // Create the user in tictac database
      const user = UserModel.create(userId, name);
      console.log(`User created in tictac service:`, user);
    } catch (error) {
      console.error("Error handling user-created event:", error);
    }
  }

  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    try {
      const { userId, name } = event;
      
      // Check if user exists
      const existingUser = UserModel.findById(userId);
      
      if (!existingUser) {
        // If user doesn't exist, create them
        if (name) {
          const user = UserModel.create(userId, name);
          console.log(`User created (from update event) in tictac service:`, user);
        } else {
          console.warn(`Cannot create user ${userId} from update event: missing username`);
        }
        return;
      }

      // Update username if provided
      if (name && name !== existingUser.name) {
        UserModel.updateUsername(userId, name);
        console.log(`User ${userId} username updated to: ${name}`);
      } else {
        console.log(`User ${userId} already up to date`);
      }
    } catch (error) {
      console.error("Error handling user-updated event:", error);
    }
  }
}