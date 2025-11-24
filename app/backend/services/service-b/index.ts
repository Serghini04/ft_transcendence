import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import KafkaConsumerService, { MessageData } from '../shared/kafkaConsumer';

const fastify = Fastify({ logger: true });

interface QueryParams {
  limit?: string;
  offset?: string;
}

const consumer = new KafkaConsumerService({
  clientId: 'service-B',
  groupId: 'group-b',
  brokers: process.env.KAFKA_BROKERS || 'kafka:9092',
  topic: process.env.KAFKA_TOPIC || 'userManagement',
  fromBeginning: true,
  maxMessages: 100,
  logger: console,

  // Optional custom message handler
  messageHandler: async (messageData: MessageData): Promise<void> => {
    console.log('Processing in Service-B:', messageData.value);
  }
});


consumer.start().catch((error: Error) => {
  console.error('Failed to start consumer:', error);
  process.exit(1);
});


fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return {
    status: consumer.getStatus().connected ? 'healthy' : 'unhealthy',
    service: 'service-b',
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
    service: 'service-b',
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
    const PORT = parseInt(process.env.PORT || '3011');
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Service-B API listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

const closeGracefully = async (signal: string): Promise<void> => {
  console.log(`${signal} signal received: closing Service-B`);
  await consumer.disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));
