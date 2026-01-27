import { Kafka, Producer } from "kafkajs";

const KAFKA_BROKER = "kafka:9092";
const KAFKA_CLIENT_ID = "chat-service";

export interface NotificationEvent {
  userId: number;
  title: string;
  message: string;
  type: string;
  timestamp: string;
  showNotifications?: boolean;
}

export interface RelationshipEvent {
  action: 'created' | 'updated' | 'deleted';
  user1_id: number;
  user2_id: number;
  type?: 'friend' | 'blocked' | 'pending';
  blocked_by_user_id?: number;
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
    if (!this.isConnected) {
      console.error("Cannot publish notification: Producer not connected");
      return;
    }

    try {
      console.log("Publishing notification to Kafka topic 'notifications':", event);
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
      console.log(`Notification event published successfully for user ${event.userId}`);
    } catch (error) {
      console.error("Failed to publish notification event:", error);
      throw error;
    }
  }
  
  async publishNewMessageNotification(recipientId: number, senderName: string, messagePreview: string, timestamp: Date | string, showNotifications: boolean = true): Promise<void> {
    const event: NotificationEvent = {
      userId: recipientId,
      title: `New message from ${senderName}`,
      message: messagePreview.length > 50 
        ? messagePreview.substring(0, 50) + "..." 
        : messagePreview,
      type: "message",
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
      showNotifications,
    };

    console.log(`Publishing notification event:`, event);
    await this.publishNotification(event);
  }

  async publishFriendRequestNotification(recipientId: number, senderName: string, senderId: number, timestamp: Date | string): Promise<void> {
    const event: NotificationEvent = {
      userId: recipientId,
      title: `Friend Request`,
      message: `${senderName} sent you a friend request`,
      type: "friend_request",
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
      showNotifications: true,
    };

    // Add metadata for friend request
    await this.producer.send({
      topic: "notifications",
      messages: [
        {
          key: recipientId.toString(),
          value: JSON.stringify({
            ...event,
            metadata: {
              senderId,
              senderName
            }
          }),
          headers: {
            "event-type": "notification.friend_request",
          },
        },
      ],
    });
    
    console.log(`Friend request notification published for user ${recipientId} from ${senderName}`);
  }

  async publishRelationshipEvent(event: RelationshipEvent): Promise<void> {
    if (!this.isConnected) {
      console.error("Cannot publish relationship event: Producer not connected");
      return;
    }

    try {
      console.log(`Publishing relationship event to Kafka topic 'relationships':`, event);
      await this.producer.send({
        topic: "relationships",
        messages: [
          {
            key: `${event.user1_id}-${event.user2_id}`,
            value: JSON.stringify(event),
            headers: {
              "event-type": `relationship.${event.action}`,
            },
          },
        ],
      });
      console.log(`✅ Relationship event published successfully: ${event.action} (user1: ${event.user1_id}, user2: ${event.user2_id})`);
    } catch (error) {
      console.error("❌ Failed to publish relationship event:", error);
      throw error;
    }
  }
}

export const kafkaProducerService = new KafkaProducerService();

