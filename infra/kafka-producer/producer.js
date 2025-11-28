const { Kafka } = require('kafkajs');
const fastify = require('fastify')({ logger: true });
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const kafkaConnectionGauge = new client.Gauge({
  name: 'kafka_producer_connected',
  help: 'Kafka producer connection status',
  registers: [register]
});

const messagesSentCounter = new client.Counter({
  name: 'kafka_messages_sent_total',
  help: 'Total number of messages sent to Kafka',
  registers: [register]
});

const messagesFailedCounter = new client.Counter({
  name: 'kafka_messages_failed_total',
  help: 'Total number of failed message sends',
  registers: [register]
});

const kafka = new Kafka({
  clientId: 'kafka-producer',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
});

const producer = kafka.producer();
const topic = process.env.KAFKA_TOPIC || 'test-topic';

let isConnected = false;

async function connectProducer() {
  try {
    await producer.connect();
    isConnected = true;
    kafkaConnectionGauge.set(1);
    console.log('Kafka producer connected successfully');
  } catch (error) {
    console.error('Error connecting producer:', error);
    kafkaConnectionGauge.set(0);
    setTimeout(connectProducer, 5000);
  }
}

connectProducer();

fastify.get('/metrics', async (request, reply) => {
  reply.type('text/plain');
  return register.metrics();
});

fastify.get('/health', async (request, reply) => {
  return {
    status: isConnected ? 'healthy' : 'unhealthy',
    service: 'kafka-producer',
    kafka: {
      connected: isConnected,
      brokers: process.env.KAFKA_BROKERS,
      topic: topic
    }
  };
});

fastify.post('/send', async (request, reply) => {
  try {
    if (!isConnected) {
      reply.code(503);
      return {
        error: 'Producer not connected to Kafka'
      };
    }

    const { message, key } = request.body;
    
    if (!message) {
      reply.code(400);
      return {
        error: 'Message is required'
      };
    }

    const result = await producer.send({
      topic: topic,
      messages: [
        {
          key: key || null,
          value: JSON.stringify({
            message: message,
            name: "soulaymane",
            age: 20,
            isstudent: true
          }),
          timestamp: Date.now().toString()
        },
      ],
    });

    messagesSentCounter.inc();
    console.log('Message sent successfully:', result);
    return {
      success: true,
      topic: topic,
      result: result
    };
  } catch (error) {
    messagesFailedCounter.inc();
    console.error('Error sending message:', error);
    reply.code(500);
    return {
      error: 'Failed to send message',
      details: error.message
    };
  }
});

fastify.post('/send-batch', async (request, reply) => {
  try {
    if (!isConnected) {
      reply.code(503);
      return {
        error: 'Producer not connected to Kafka'
      };
    }

    const { messages } = request.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      reply.code(400);
      return {
        error: 'Messages array is required'
      };
    }

    const kafkaMessages = messages.map((msg) => ({
      key: msg.key || null,
      value: typeof msg.value === 'string' ? msg.value : JSON.stringify(msg.value),
      timestamp: Date.now().toString()
    }));

    const result = await producer.send({
      topic: topic,
      messages: kafkaMessages,
    });

    messagesSentCounter.inc(messages.length);
    console.log(`Batch of ${messages.length} messages sent successfully`);
    return {
      success: true,
      topic: topic,
      count: messages.length,
      result: result
    };
  } catch (error) {
    messagesFailedCounter.inc();
    console.error('Error sending batch:', error);
    reply.code(500);
    return {
      error: 'Failed to send batch',
      details: error.message
    };
  }
});

const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Kafka producer API listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

const closeGracefully = async (signal) => {
  console.log(`${signal} signal received: closing Kafka producer`);
  await producer.disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));
