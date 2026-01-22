import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { config } from 'dotenv';
import { runMigrations } from './config/migrate.js';
import { userRoutes } from './routes/user.routes.js';
import { gameRoutes } from './routes/game.routes.js';
import { matchmakingRoutes } from './routes/matchmaking.routes.js';
import { WebSocketHandler } from './services/websocket.service.js';
import { KafkaConsumerService } from './kafka/consumer.js';
import { getKafkaProducer } from './kafka/producer.js';


config();

const PORT = parseInt(process.env.PORT || '3030');
const HOST = process.env.HOST || '0.0.0.0';

const kafkaConsumer = new KafkaConsumerService();
const kafkaProducer = getKafkaProducer();

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production' 
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined
  }
});

async function start() {
  try {
    
    runMigrations();

    await fastify.register(helmet, {
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
    });

    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
      credentials: true
    });

    await fastify.register(rateLimit, {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000')
    });

    
    await fastify.register(websocket);

    fastify.get('/health', async () => {
      return { 
        status: 'ok', 
        timestamp: Date.now(),
        service: 'tictac-game'
      };
    });

    
    await fastify.register(userRoutes, { prefix: '/api' });
    await fastify.register(gameRoutes, { prefix: '/api' });
    await fastify.register(matchmakingRoutes, { prefix: '/api' });

    WebSocketHandler.setup(fastify);

    fastify.get('/api/ws/stats', async () => {
      return WebSocketHandler.getStats();
    });

  
    await kafkaConsumer.connect();
    fastify.log.info('Kafka consumer connected');

    // Connect Kafka producer
    await kafkaProducer.connect();
    fastify.log.info('Kafka producer connected');

    
    await fastify.listen({ port: PORT, host: HOST });
    
    fastify.log.info(`TicTac Game Service running on ${HOST}:${PORT}`);
    fastify.log.info(` Health check: http://${HOST}:${PORT}/health`);
    fastify.log.info(`WebSocket: ws://${HOST}:${PORT}/ws`);

  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}


const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, closing server`);
    await kafkaConsumer.disconnect();
    await kafkaProducer.disconnect();
    await fastify.close();
    process.exit(0);
  });
});

start();
