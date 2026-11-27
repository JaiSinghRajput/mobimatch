import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getPool } from '../../db';
import { isCacheReady } from '../../cache';
import { config } from '../../config';
import { AppConfigResponse } from '@mobimatch/api-contracts';

export const healthRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Liveness probe
  server.get('/health/live', async (req, reply) => {
    return reply.status(200).send({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe
  server.get('/health/ready', async (req, reply) => {
    let dbStatus = 'down';
    try {
      const pool = getPool();
      const res = await pool.query('SELECT 1 as alive');
      if (res.rows && res.rows[0]?.alive === 1) {
        dbStatus = 'ready';
      }
    } catch (err) {
      dbStatus = 'error';
    }

    const cacheStatus = isCacheReady() ? 'ready' : 'degraded_db_fallback';
    const isHealthy = dbStatus === 'ready';

    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'ready' : 'not_ready',
      database: dbStatus,
      cache: cacheStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // App Configuration
  server.get('/v1/app-config', async (req, reply) => {
    const response: AppConfigResponse = {
      isMaintenanceMode: config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage,
      minUserAppVersion: config.minUserAppVersion,
      latestUserAppVersion: config.latestUserAppVersion,
      userAppUpdateUrl: config.userAppUpdateUrl,
      minAdminAppVersion: config.minAdminAppVersion,
      latestAdminAppVersion: config.latestAdminAppVersion,
      adminAppUpdateUrl: config.adminAppUpdateUrl,
      termsUrl: config.termsUrl,
      privacyPolicyUrl: config.privacyPolicyUrl,
      accountDeletionUrl: config.accountDeletionUrl,
      demoMode: config.demoMode,
    };
    return reply.status(200).send(response);
  });

  // Public Web Account Deletion Page (Google Play Compliance)
  server.get('/account-deletion', async (req, reply) => {
    const fs = await import('fs');
    const path = await import('path');
    const htmlPath = path.resolve(__dirname, '../../../public/account-deletion.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      return reply.type('text/html').send(html);
    }
    return reply.status(404).send('Not Found');
  });

  // Public Privacy Policy Page (Google Play Compliance)
  server.get('/privacy', async (req, reply) => {
    const fs = await import('fs');
    const path = await import('path');
    const htmlPath = path.resolve(__dirname, '../../../public/privacy-policy.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      return reply.type('text/html').send(html);
    }
    return reply.status(404).send('Not Found');
  });

  // Public Terms & Conditions Page
  server.get('/terms', async (req, reply) => {
    const fs = await import('fs');
    const path = await import('path');
    const htmlPath = path.resolve(__dirname, '../../../public/terms.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      return reply.type('text/html').send(html);
    }
    return reply.status(404).send('Not Found');
  });
};
