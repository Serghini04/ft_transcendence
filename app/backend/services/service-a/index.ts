import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import KafkaProducerService from './shared/kafkaProducer';

const fastify = Fastify({ logger: true });

interface SendMessageBody {
  userId?: number;
  userName?: string;
  event?: string;
}

interface SendBatchBody {
  messages: any[];
}

const producer = new KafkaProducerService({
  clientId: 'service-A',
  brokers: process.env.KAFKA_BROKERS || 'kafka:9092',
  topic: process.env.KAFKA_TOPIC || 'userManagement',
  logger: console
});

producer.connect(5000);


fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return {
    status: producer.getStatus().connected ? 'healthy' : 'unhealthy',
    service: 'service-a',
    kafka: producer.getStatus()
  };
});


fastify.post<{ Body: SendMessageBody }>('/send', async (request: FastifyRequest<{ Body: SendMessageBody }>, reply: FastifyReply) => {
  try {
    if (!producer.getStatus().connected) {
      reply.code(503);
      return { error: 'Producer not connected to Kafka' };
    }

    const { userId, userName, event } = request.body;
    
    const message = {
      event: event || 'USER_CREATED',
      user: {
        id: userId || Math.floor(Math.random() * 1000),
        name: userName || 'hicham'
      },
      timestamp: new Date().toISOString()
    };

    const result = await producer.send(message);
    return result;
  } catch (error: any) {
    console.error('Error sending message:', error);
    reply.code(500);
    return { error: 'Failed to send message', details: error.message };
  }
});


fastify.post<{ Body: SendBatchBody }>('/send-batch', async (request: FastifyRequest<{ Body: SendBatchBody }>, reply: FastifyReply) => {
  
  try {
    if (!producer.getStatus().connected) {
      reply.code(503);
      return { error: 'Producer not connected to Kafka' };
    }

    const { messages } = request.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      reply.code(400);
      return { error: 'messages must be a non-empty array' };
    }

    const result = await producer.sendBatch(messages);
    return result;
  } catch (error: any) {
    console.error(' Error sending batch:', error);
    reply.code(500);
    return { error: 'Failed to send batch', details: error.message };
  }
});

fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
  return producer.getStatus();
});

const start = async (): Promise<void> => {
  try {
    const PORT = parseInt(process.env.PORT || '3010');
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(` Service-A API listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();


const closeGracefully = async (signal: string): Promise<void> => {
  console.log(`${signal} signal received: closing Service-A`);
  await producer.disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));
