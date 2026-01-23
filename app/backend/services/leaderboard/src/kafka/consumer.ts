import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { insertGame, updatePlayerStats, updateTicTacToeStats } from "../db/index";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";

interface GameFinishedEvent {
  gameId: string;
  mode: string;
  player1Id: string;
  player2Id: string;
  winnerId: string;
  score1: number;
  score2: number;
  createdAt: number;
}

interface TicTacToeGameFinishedEvent {
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

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: "leaderboard-service",
      brokers: [KAFKA_BROKER],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: "leaderboard-consumers-v2",  // Changed to force reading from beginning
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log("✅ Kafka consumer connected");
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
      console.log("👋 Kafka consumer disconnected");
    } catch (error) {
      console.error("Error disconnecting consumer:", error);
    }
  }

  async startConsuming(): Promise<void> {
    const maxRetries = 10;
    let retryCount = 0;

    const tryConnect = async (): Promise<void> => {
      try {
        if (!this.isConnected) {
          await this.connect();
        }

        // Subscribe to both topics
        await this.consumer.subscribe({
          topics: ["game-events", "gameFinished"],
          fromBeginning: true,
        });

        console.log("📡 Listening for game events (PingPong & TicTacToe)...");

        await this.consumer.run({
          eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
            try {
              if (topic === "game-events") {
                await this.handlePingPongEvent(message);
              } else if (topic === "gameFinished") {
                await this.handleTicTacToeEvent(message);
              }
            } catch (error) {
              console.error("❌ Error processing message:", error);
            }
          },
        });
      } catch (error) {
        retryCount++;
        if (retryCount <= maxRetries) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          console.log(`⚠️ Kafka connection failed, retrying in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
          setTimeout(() => tryConnect(), retryDelay);
        } else {
          console.error("❌ Max retries reached, Kafka consumer will not be available");
          throw error;
        }
      }
    };

    await tryConnect();
  }

  private async handlePingPongEvent(message: any): Promise<void> {
    const eventType = message.headers?.["event-type"]?.toString();

    if (eventType !== "game.finished") {
      return;
    }

    const value = message.value?.toString();
    if (!value) {
      console.warn("⚠️ Received empty PingPong message");
      return;
    }

    const event: GameFinishedEvent = JSON.parse(value);

    console.log(`📥 Received PingPong game.finished: ${event.gameId}`);
    console.log(`   Winner: ${event.winnerId}`);
    console.log(`   Score: ${event.score1}-${event.score2}`);

    // Insert game into database
    insertGame({
      gameId: event.gameId,
      mode: event.mode,
      player1Id: event.player1Id,
      player2Id: event.player2Id,
      winnerId: event.winnerId,
      score1: event.score1,
      score2: event.score2,
      createdAt: event.createdAt,
    });

    // Update player1 stats
    const player1IsWinner = event.winnerId === event.player1Id;
    updatePlayerStats(
      event.player1Id,
      player1IsWinner,
      event.score1,
      event.score2, // goals conceded by player1
      Math.floor(event.createdAt / 1000)
    );

    // Update player2 stats
    const player2IsWinner = event.winnerId === event.player2Id;
    updatePlayerStats(
      event.player2Id,
      player2IsWinner,
      event.score2,
      event.score1, // goals conceded by player2
      Math.floor(event.createdAt / 1000)
    );

    console.log(`✅ Processed PingPong game ${event.gameId}`);
  }

  private async handleTicTacToeEvent(message: any): Promise<void> {
    const value = message.value?.toString();
    if (!value) {
      console.warn("⚠️ Received empty TicTacToe message");
      return;
    }

    const event: TicTacToeGameFinishedEvent = JSON.parse(value);

    console.log(`📥 Received TicTacToe game finished: ${event.gameId}`);
    console.log(`   Winner: ${event.winnerId || 'Draw'}`);
    console.log(`   Draw: ${event.isDraw}`);

    const gameTimestamp = Math.floor(event.finishedAt / 1000);

    // Update player1 stats
    const player1IsWinner = event.winnerId === event.player1Id;
    updateTicTacToeStats(
      event.player1Id,
      player1IsWinner,
      event.isDraw,
      gameTimestamp
    );

    // Update player2 stats
    const player2IsWinner = event.winnerId === event.player2Id;
    updateTicTacToeStats(
      event.player2Id,
      player2IsWinner,
      event.isDraw,
      gameTimestamp
    );

    console.log(`✅ Processed TicTacToe game ${event.gameId}`);
  }
}

export const kafkaConsumerService = new KafkaConsumerService();