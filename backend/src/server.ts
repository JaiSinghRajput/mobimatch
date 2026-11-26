import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { runMigrations, closeDb } from './db';
import { closeCache } from './cache';
import { healthRoutes } from './modules/health';
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/users';
import { catalogRoutes } from './modules/catalog';
import { compatibilityRoutes } from './modules/compatibility';
import { reportRoutes } from './modules/reports';
import { adminRoutes } from './modules/admins';
import { adsRoutes } from './modules/ads';
import { legalRoutes } from './modules/legal';
import './types';

export function buildServer(): FastifyInstance {
  const server = fastify({
    logger: config.nodeEnv !== 'test',
    genReqId: () => uuidv4(),
    bodyLimit: 1048576, // 1MB body limit for safety
  });

  // Support empty JSON bodies gracefully without throwing FST_ERR_CTP_EMPTY_JSON_BODY
  server.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body, defaultDone) => {
      const str = typeof body === 'string' ? body : body.toString('utf8');
      if (!str || str.trim() === '') {
        defaultDone(null, {});
        return;
      }
      try {
        defaultDone(null, JSON.parse(str));
      } catch (err) {
        defaultDone(err as Error, undefined);
      }
    }
  );

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
  server.register(adsRoutes);
  server.register(legalRoutes);

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

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('Shutting down MobiMatch Backend server gracefully...');
      await server.close();
      await closeDb();
      await closeCache();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
