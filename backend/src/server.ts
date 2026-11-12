import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { runMigrations } from './db';
import { healthRoutes } from './modules/health';
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/users';
import { catalogRoutes } from './modules/catalog';
import { compatibilityRoutes } from './modules/compatibility';
import { reportRoutes } from './modules/reports';
import { adminRoutes } from './modules/admins';
import './types';

export function buildServer(): FastifyInstance {
  const server = fastify({
    logger: config.nodeEnv !== 'test',
    genReqId: () => uuidv4(),
    bodyLimit: 1048576, // 1MB body limit for safety
  });

  // Plugins
  server.register(cors, {
    origin: true,
  });

  server.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  server.register(jwt, {
    secret: config.jwtAccessSecret,
  });

  // Global Error Handler
  server.setErrorHandler((error, req, reply) => {
    console.error('SERVER ERROR:', error);
    server.log.error(error);

    const statusCode = error.statusCode || 500;
    const isClientError = statusCode < 500;

    return reply.status(statusCode).send({
      error: {
        code: error.code || (isClientError ? 'CLIENT_ERROR' : 'INTERNAL_SERVER_ERROR'),
        message: error.message || 'An internal server error occurred',
        requestId: req.id,
      },
    });
  });

  // Register Modules
  server.register(healthRoutes);
  server.register(authRoutes);
  server.register(userRoutes);
  server.register(catalogRoutes);
  server.register(compatibilityRoutes);
  server.register(reportRoutes);
  server.register(adminRoutes);

  return server;
}

export async function startServer() {
  const server = buildServer();

  try {
    console.log('Running database migrations...');
    await runMigrations();

    await server.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`MobiMatch Backend running at http://${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
