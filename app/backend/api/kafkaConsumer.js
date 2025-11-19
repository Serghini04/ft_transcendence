import { Kafka } from 'kafkajs';
import { upsertUser } from './database.js';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'game-service';
const topic = process.env.USER_KAFKA_TOPIC || 'users.created';

export async function startKafkaConsumer() {
  const kafka = new Kafka({ clientId, brokers });
  const consumer = kafka.consumer({ groupId: `${clientId}-group` });

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = message.value.toString();
        const data = JSON.parse(payload);

        // Expecting message shape: { id, name, avatar, level }
        if (data && data.id) {
          await upsertUser({
            id: data.id,
            name: data.name || data.username || `Player_${String(data.id).slice(0,6)}`,
            avatar: data.avatar || data.profilePicture || null,
            level: typeof data.level === 'number' ? data.level : null,
          });
          console.log(`Kafka: upserted user ${data.id}`);
        }
      } catch (err) {
        console.error('Kafka consumer error processing message:', err);
      }
    }
  });

  console.log(`Kafka consumer started, subscribed to ${topic}`);
}

export default startKafkaConsumer;
