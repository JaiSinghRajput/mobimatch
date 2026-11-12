import { getPool, getDb, runMigrations, closeDb } from '../src/db';
import { buildServer } from '../src/server';
import { FastifyInstance } from 'fastify';

export async function setupTestEnvironment(): Promise<{
  server: FastifyInstance;
}> {
  // Run schema migrations against real PostgreSQL
  await runMigrations();

  const pool = getPool();
  const client = await pool.connect();

  try {
    // Truncate tables for a clean test state
    await client.query(`
      TRUNCATE TABLE 
        compatibility_group_members,
        compatibility_groups,
        issue_reports,
        model_requests,
        mobile_models,
        brands,
        spare_part_categories,
        sessions,
        users,
        admin_allowlist
      CASCADE;
    `);

    // Seed initial admin
    await client.query(`
      INSERT INTO admin_allowlist (email_normalized) 
      VALUES ('admin@mobimatch.local')
      ON CONFLICT DO NOTHING;
    `);
  } finally {
    client.release();
  }

  const server = buildServer();
  await server.ready();

  return { server };
}

export async function cleanupTestEnvironment(): Promise<void> {
  await closeDb();
}
