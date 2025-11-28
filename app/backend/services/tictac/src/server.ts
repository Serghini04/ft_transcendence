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

// Load environment variables
config();

const PORT = parseInt(process.env.PORT || '3004');
const HOST = process.env.HOST || '0.0.0.0';

// Create Fastify instance
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
    // Run database migrations
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

    // Register WebSocket
    await fastify.register(websocket);

    // Health check
    fastify.get('/health', async () => {
      return { 
        status: 'ok', 
        timestamp: Date.now(),
        service: 'tictac-game'
      };
    });

    // Register routes
    await fastify.register(userRoutes, { prefix: '/api' });
    await fastify.register(gameRoutes, { prefix: '/api' });
    await fastify.register(matchmakingRoutes, { prefix: '/api' });

    // Setup WebSocket
    WebSocketHandler.setup(fastify);

    // WebSocket stats endpoint
    fastify.get('/api/ws/stats', async () => {
      return WebSocketHandler.getStats();
    });

    // Start server
    await fastify.listen({ port: PORT, host: HOST });
    
    fastify.log.info(`🎮 TicTac Game Service running on ${HOST}:${PORT}`);
    fastify.log.info(`📊 Health check: http://${HOST}:${PORT}/health`);
    fastify.log.info(`🔌 WebSocket: ws://${HOST}:${PORT}/ws`);

  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, closing server...`);
    await fastify.close();
    process.exit(0);
  });
});

start();
