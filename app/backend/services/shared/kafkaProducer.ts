import { Kafka, Producer, ProducerRecord, Message } from 'kafkajs';

interface KafkaProducerConfig {
  clientId?: string;
  brokers?: string | string[];
  topic?: string;
  logger?: Console;
}

interface SendOptions {
  topic?: string;
  key?: string;
}

interface SendResult {
  success: boolean;
  message: any;
  topic: string;
}

interface SendBatchResult {
  success: boolean;
  count: number;
  topic: string;
}

interface ProducerStatus {
  clientId: string;
  connected: boolean;
  topic: string;
}

class KafkaProducerService {
  private clientId: string;
  private topic: string;
  private logger: Console;
  private isConnected: boolean;
  private kafka: Kafka;
  private producer: Producer;

  constructor(config: KafkaProducerConfig = {}) {
    const {
      clientId = 'default-producer',
      brokers = process.env.KAFKA_BROKERS || 'kafka:9092',
      topic = process.env.KAFKA_TOPIC || 'userManagement',
      logger = console
    } = config;

    this.clientId = clientId;
    this.topic = topic;
    this.logger = logger;
    this.isConnected = false;

    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: Array.isArray(brokers) ? brokers : [brokers]
    });

    this.producer = this.kafka.producer();
  }

  async connect(retryInterval: number = 5000): Promise<boolean> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log(`${this.clientId} Producer connected to Kafka`);
      return true;
    } catch (error) {
      this.logger.error(`Error connecting ${this.clientId}:`, error);
      if (retryInterval > 0) {
        this.logger.log(`Retrying connection in ${retryInterval}ms...`);
        setTimeout(() => this.connect(retryInterval), retryInterval);
      }
      return false;
    }
  }

  async send(message: any, options: SendOptions = {}): Promise<SendResult> {
    try {
      if (!this.isConnected) {
        throw new Error('Producer not connected to Kafka');
      }

      const topic = options.topic || this.topic;
      const key = options.key || undefined;
      
      const kafkaMessage: Message = {
        value: typeof message === 'string' ? message : JSON.stringify(message)
      };

      if (key) {
        kafkaMessage.key = key;
      }

      await this.producer.send({
        topic,
        messages: [kafkaMessage],
      });

      this.logger.log(`Message sent from ${this.clientId}:`, message);
      return { success: true, message, topic };
    } catch (error) {
      this.logger.error(`Error sending message from ${this.clientId}:`, error);
      throw error;
    }
  }

  async sendBatch(messages: any[], options: SendOptions = {}): Promise<SendBatchResult> {
    try {
      if (!this.isConnected) {
        throw new Error('Producer not connected to Kafka');
      }

      const topic = options.topic || this.topic;
      
      const kafkaMessages: Message[] = messages.map(msg => ({
        value: typeof msg === 'string' ? msg : JSON.stringify(msg)
      }));

      await this.producer.send({
        topic,
        messages: kafkaMessages,
      });

      this.logger.log(`Batch of ${messages.length} messages sent from ${this.clientId}`);
      return { success: true, count: messages.length, topic };
    } catch (error) {
      this.logger.error(`Error sending batch from ${this.clientId}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log(`${this.clientId} Producer disconnected`);
    } catch (error) {
      this.logger.error(` Error disconnecting ${this.clientId}:`, error);
    }
  }

  getStatus(): ProducerStatus {
    return {
      clientId: this.clientId,
      connected: this.isConnected,
      topic: this.topic
    };
  }
}

export default KafkaProducerService;
export { KafkaProducerConfig, SendOptions, SendResult, SendBatchResult, ProducerStatus };
