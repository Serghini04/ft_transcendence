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

  async publishRelationshipCreated(relationshipData: {
    user1_id: number;
    user2_id: number;
    type: 'friend' | 'blocked' | 'pending';
    blocked_by_user_id?: number;
  }): Promise<void> {
    if (!this.isConnected) {
      console.error("Cannot publish relationship: Producer not connected");
      return;
    }

    try {
      console.log("Publishing relationship created to Kafka topic 'relationships':", relationshipData);
      await this.producer.send({
        topic: "relationships",
        messages: [
          {
            key: `${relationshipData.user1_id}-${relationshipData.user2_id}`,
            value: JSON.stringify({
              action: 'created',
              ...relationshipData,
              timestamp: new Date().toISOString()
            }),
            headers: {
              "event-type": "relationship.created",
            },
          },
        ],
      });
      console.log(`Relationship created event published successfully`);
    } catch (error) {
      console.error("Failed to publish relationship created event:", error);
      throw error;
    }
  }

  async publishRelationshipUpdated(relationshipData: {
    user1_id: number;
    user2_id: number;
    type: 'friend' | 'blocked' | 'pending';
    blocked_by_user_id?: number;
  }): Promise<void> {
    if (!this.isConnected) {
      console.error("Cannot publish relationship: Producer not connected");
      return;
    }

    try {
      console.log("Publishing relationship updated to Kafka topic 'relationships':", relationshipData);
      await this.producer.send({
        topic: "relationships",
        messages: [
          {
            key: `${relationshipData.user1_id}-${relationshipData.user2_id}`,
            value: JSON.stringify({
              action: 'updated',
              ...relationshipData,
              timestamp: new Date().toISOString()
            }),
            headers: {
              "event-type": "relationship.updated",
            },
          },
        ],
      });
      console.log(`Relationship updated event published successfully`);
    } catch (error) {
      console.error("Failed to publish relationship updated event:", error);
      throw error;
    }
  }

  async publishRelationshipDeleted(user1_id: number, user2_id: number): Promise<void> {
    if (!this.isConnected) {
      console.error("Cannot publish relationship: Producer not connected");
      return;
    }

    try {
      console.log("Publishing relationship deleted to Kafka topic 'relationships':", { user1_id, user2_id });
      await this.producer.send({
        topic: "relationships",
        messages: [
          {
            key: `${user1_id}-${user2_id}`,
            value: JSON.stringify({
              action: 'deleted',
              user1_id,
              user2_id,
              timestamp: new Date().toISOString()
            }),
            headers: {
              "event-type": "relationship.deleted",
            },
          },
        ],
      });
      console.log(`Relationship deleted event published successfully`);
    } catch (error) {
      console.error("Failed to publish relationship deleted event:", error);
      throw error;
    }
  }
}

export const kafkaProducerService = new KafkaProducerService();

