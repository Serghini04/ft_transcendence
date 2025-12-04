const { Kafka } = require('kafkajs');
const fastify = require('fastify')({ logger: true });
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const kafkaConnectionGauge = new client.Gauge({
  name: 'kafka_consumer_connected',
  help: 'Kafka consumer connection status',
  registers: [register]
});

const messagesReceivedCounter = new client.Counter({
  name: 'kafka_messages_received_total',
  help: 'Total number of messages received from Kafka',
  registers: [register]
});

const messagesStoredGauge = new client.Gauge({
  name: 'kafka_messages_stored',
  help: 'Number of messages currently stored in memory',
  registers: [register]
});

const kafka = new Kafka({
  clientId: 'kafka-consumer',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
});

const consumer = kafka.consumer({ groupId: 'test-group' });
const topic = process.env.KAFKA_TOPIC || 'test-topic';

let isConnected = false;
let messages = [];
const MAX_MESSAGES = 1000;

async function connectConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: topic, fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value.toString();
        const key = message.key ? message.key.toString() : null;
        
        const messageData = {
          topic,
          partition,
          offset: message.offset,
          key,
          value,
          timestamp: message.timestamp,
          receivedAt: new Date().toISOString()
        };
        
        console.log('Received message:', messageData);
        
        messages.push(messageData);
        if (messages.length > MAX_MESSAGES) {
          messages.shift();
        }
        
        messagesReceivedCounter.inc();
        messagesStoredGauge.set(messages.length);
      },
    });
    
    isConnected = true;
    kafkaConnectionGauge.set(1);
    console.log('Kafka consumer connected successfully');
  } catch (error) {
    console.error('Error connecting consumer:', error);
    kafkaConnectionGauge.set(0);
    setTimeout(connectConsumer, 5000);
  }
}

connectConsumer();

fastify.get('/metrics', async (request, reply) => {
  reply.type('text/plain');
  return register.metrics();
});

fastify.get('/health', async (request, reply) => {
  return {
    status: isConnected ? 'healthy' : 'unhealthy',
    service: 'kafka-consumer',
    kafka: {
      connected: isConnected,
      brokers: process.env.KAFKA_BROKERS,
      topic: topic,
      messagesReceived: messages.length
    }
  };
});

fastify.get('/messages', async (request, reply) => {
  const limit = parseInt(request.query.limit) || 100;
  const offset = parseInt(request.query.offset) || 0;
  
  const paginatedMessages = messages.slice(offset, offset + limit);
  
  return {
    total: messages.length,
    offset: offset,
    limit: limit,
    messages: paginatedMessages
  };
});

fastify.get('/messages/latest', async (request, reply) => {
  if (messages.length === 0) {
    reply.code(404);
    return {
      error: 'No messages received yet'
    };
  }
  
  return messages[messages.length - 1];
});

fastify.delete('/messages', async (request, reply) => {
  const count = messages.length;
  messages = [];
  messagesStoredGauge.set(0);
  
  return {
    success: true,
    messagesCleared: count
  };
});

fastify.get('/stats', async (request, reply) => {
  const stats = {
    totalMessages: messages.length,
    oldestMessage: messages.length > 0 ? messages[0].receivedAt : null,
    latestMessage: messages.length > 0 ? messages[messages.length - 1].receivedAt : null,
    topics: [...new Set(messages.map(m => m.topic))],
    partitions: [...new Set(messages.map(m => m.partition))]
  };
  
  return stats;
});

const start = async () => {
  try {
    const PORT = process.env.PORT || 3002;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Kafka consumer API listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

const closeGracefully = async (signal) => {
  console.log(`${signal} signal received: closing Kafka consumer`);
  await consumer.disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));
