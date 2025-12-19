import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

interface KafkaConsumerConfig {
  clientId?: string;
  groupId?: string;
  brokers?: string | string[];
  topic?: string | string[];
  fromBeginning?: boolean;
  maxMessages?: number;
  logger?: Console;
  messageHandler?: (messageData: MessageData) => Promise<void>;
}

interface MessageData {
  topic: string;
  partition: number;
  offset: string;
  value: any;
  rawValue: string;
  timestamp: string;
  key: string | null;
}

interface MessagesResponse {
  total: number;
  offset: number;
  limit: number;
  messages: MessageData[];
}

interface ConsumerStats {
  clientId: string;
  groupId: string;
  totalMessages: number;
  oldestMessage: string | null;
  latestMessage: string | null;
}

interface ResetResult {
  success: boolean;
  messagesCleared: number;
}

interface ConsumerStatus {
  clientId: string;
  groupId: string;
  connected: boolean;
  topic: string | string[];
  messagesReceived: number;
}

class KafkaConsumerService {
  private clientId: string;
  private groupId: string;
  private topic: string | string[];
  private fromBeginning: boolean;
  private maxMessages: number;
  private logger: Console;
  private isConnected: boolean;
  private messages: MessageData[];
  private messageHandler: ((messageData: MessageData) => Promise<void>) | null;
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(config: KafkaConsumerConfig = {}) {
    const {
      clientId = 'default-consumer',
      groupId = 'default-group',
      brokers = process.env.KAFKA_BROKERS || 'kafka:9092',
      topic = process.env.KAFKA_TOPIC || 'userManagement',
      fromBeginning = true,
      maxMessages = 100,
      logger = console,
      messageHandler = null
    } = config;

    this.clientId = clientId;
    this.groupId = groupId;
    this.topic = topic;
    this.fromBeginning = fromBeginning;
    this.maxMessages = maxMessages;
    this.logger = logger;
    this.isConnected = false;
    this.messages = [];
    this.messageHandler = messageHandler;

    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: Array.isArray(brokers) ? brokers : [brokers]
    });

    this.consumer = this.kafka.consumer({ groupId: this.groupId });
  }

  async connect(): Promise<boolean> {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log(`${this.clientId} Consumer connected to Kafka`);
      return true;
    } catch (error) {
      this.logger.error(`Error connecting ${this.clientId}:`, error);
      throw error;
    }
  }

  async subscribe(topics?: string | string[]): Promise<boolean> {
    try {
      const topicsToSubscribe = topics || this.topic;
      const topicArray = Array.isArray(topicsToSubscribe) 
        ? topicsToSubscribe 
        : [topicsToSubscribe];

      for (const topic of topicArray) {
        await this.consumer.subscribe({ 
          topic, 
          fromBeginning: this.fromBeginning 
        });
        this.logger.log(`${this.clientId} subscribed to topic: ${topic}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error subscribing ${this.clientId}:`, error);
      throw error;
    }
  }

  async run(customHandler?: (messageData: MessageData) => Promise<void>): Promise<void> {
    try {
      const handler = customHandler || this.messageHandler || this.defaultMessageHandler.bind(this);

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          const value = message.value?.toString() || '';
          let parsedValue: any;

          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value;
          }

          const messageData: MessageData = {
            topic,
            partition,
            offset: message.offset,
            value: parsedValue,
            rawValue: value,
            timestamp: new Date().toISOString(),
            key: message.key?.toString() || null
          };

          this.logger.log(`📥 ${this.clientId} received:`, value);
          this.logger.log(`   Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}`);

          // Store message
          this.messages.push(messageData);
          if (this.messages.length > this.maxMessages) {
            this.messages.shift();
          }

          // Call custom handler
          try {
            await handler(messageData);
          } catch (error) {
            this.logger.error(`Error in message handler for ${this.clientId}:`, error);
          }
        },
      });
    } catch (error) {
      this.logger.error(` Error running ${this.clientId}:`, error);
      throw error;
    }
  }

  private async defaultMessageHandler(messageData: MessageData): Promise<void> {
    // Default handler does nothing except log (already logged in run())
    // Override this or pass custom handler
  }

  async start(topics?: string | string[]): Promise<void> {
    await this.connect();
    await this.subscribe(topics);
    await this.run();
  }

  async disconnect(): Promise<void> {
    try {
        await this.consumer.disconnect();
        this.isConnected = false;
        this.logger.log(`${this.clientId} Consumer disconnected`);
    } catch (error) {
      this.logger.error(` Error disconnecting ${this.clientId}:`, error);
    }
  }

  getMessages(limit: number = 10, offset: number = 0): MessagesResponse {
    return {
      total: this.messages.length,
      offset,
      limit,
      messages: this.messages.slice(offset, offset + limit)
    };
  }

  getLatestMessage(): MessageData | null {
    if (this.messages.length === 0) {
      return null;
    }
    return this.messages[this.messages.length - 1];
  }

  getStats(): ConsumerStats {
    return {
      clientId: this.clientId,
      groupId: this.groupId,
      totalMessages: this.messages.length,
      oldestMessage: this.messages.length > 0 ? this.messages[0].timestamp : null,
      latestMessage: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : null
    };
  }

  resetMessages(): ResetResult {
    const count = this.messages.length;
    this.messages.length = 0;
    return { success: true, messagesCleared: count };
  }

  getStatus(): ConsumerStatus {
    return {
      clientId: this.clientId,
      groupId: this.groupId,
      connected: this.isConnected,
      topic: this.topic,
      messagesReceived: this.messages.length
    };
  }
}

export default KafkaConsumerService;
export { 
  KafkaConsumerConfig, 
  MessageData, 
  MessagesResponse, 
  ConsumerStats, 
  ResetResult, 
  ConsumerStatus 
};
