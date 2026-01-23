import { Kafka, Producer } from "kafkajs";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "tictac-service";

export interface GameFinishedEvent {
  gameId: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  winnerSymbol: 'X' | 'O' | null;
  isDraw: boolean;
  moves: number;
  duration: number;
  reason?: 'win' | 'draw' | 'forfeit' | 'disconnect';
  finishedAt: number;
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
      console.log("Connecting Kafka producer...");
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

  async publishGameFinished(event: GameFinishedEvent): Promise<void> {
    if (!this.isConnected) {
      console.warn("Kafka producer not connected, skipping event publish");
      return;
    }

    try {
      await this.producer.send({
        topic: "gameFinished",
        messages: [
          {
            key: event.gameId,
            value: JSON.stringify(event),
            headers: {
              eventType: "gameFinished",
              timestamp: String(Date.now()),
            },
          },
        ],
      });

      console.log(`Published gameFinished event for game ${event.gameId} to Kafka`);
    } catch (error) {
      console.error("Failed to publish gameFinished event to Kafka:", error);
    }
  }
}

let producerInstance: KafkaProducerService | null = null;

export function getKafkaProducer(): KafkaProducerService {
  if (!producerInstance) {
    producerInstance = new KafkaProducerService();
  }
  return producerInstance;
}
