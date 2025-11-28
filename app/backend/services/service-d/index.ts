import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import KafkaConsumerService, { MessageData } from './shared/kafkaConsumer';

const fastify = Fastify({ logger: true });

interface QueryParams {
  limit?: string;
  offset?: string;
}

const consumer = new KafkaConsumerService({
  clientId: 'service-D',
  groupId: 'group-d',
  brokers: process.env.KAFKA_BROKERS || 'kafka:9092',
  topic: process.env.KAFKA_TOPIC || 'userManagement',
  fromBeginning: true,
  maxMessages: 100,
  logger: console,

  // Custom message handler for service-d specific logic
  messageHandler: async (messageData: MessageData): Promise<void> => {
    console.log('Processing in Service-D:', messageData.value);
  }
});

consumer.start().catch((error: Error) => {
  console.error('Failed to start consumer:', error);
  process.exit(1);
});


fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return {
    status: consumer.getStatus().connected ? 'healthy' : 'unhealthy',
    service: 'service-d',
    kafka: consumer.getStatus()
  };
});


fastify.get<{ Querystring: QueryParams }>('/messages', async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
  const limit = parseInt(request.query.limit || '10');
  const offset = parseInt(request.query.offset || '0');
  
  return consumer.getMessages(limit, offset);
});

fastify.get('/messages/latest', async (request: FastifyRequest, reply: FastifyReply) => {
  const latest = consumer.getLatestMessage();
  
  if (!latest) {
    reply.code(404);
    return { error: 'No messages received yet' };
  }
  
  return latest;
});


fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
  return {
    service: 'service-d',
    ...consumer.getStats()
  };
});


fastify.post('/reset', async (request: FastifyRequest, reply: FastifyReply) => {
  return consumer.resetMessages();
});


fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
  return consumer.getStatus();
});

const start = async (): Promise<void> => {
  try {
    const PORT = parseInt(process.env.PORT || '3013');
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Service-D API listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
const closeGracefully = async (signal: string): Promise<void> => {
  console.log(`${signal} signal received: closing Service-D`);
  await consumer.disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));
