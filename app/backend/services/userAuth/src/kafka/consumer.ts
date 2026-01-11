import pkg from 'kafkajs';
import type { EachMessagePayload } from 'kafkajs';

const { Kafka } = pkg;


const kafka = new Kafka({
  clientId: 'test-consumer',
  brokers: ['kafka:9092'], // change if needed
});

const consumer = kafka.consumer({
  groupId: 'test-group',
});

async function run(): Promise<void> {
  await consumer.connect();

  await consumer.subscribe({
    topic: 'your-topic-name', // 👈 change this
    fromBeginning: true,
  });

  console.log('✅ Kafka consumer connected. Waiting for messages...');

  await consumer.run({
    eachMessage: async ({
      topic,
      partition,
      message,
    }: EachMessagePayload) => {
      console.log('📩 Message received');
      console.log({
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        value: message.value?.toString(),
        timestamp: message.timestamp,
      });
    },
  });
}

run().catch((err) => {
  console.error('❌ Consumer error:', err);
  process.exit(1);
});
