import { Pool, PoolClient } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import * as schema from './schema';

let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

/**
 * Allows test suites to inject an in-memory or mock DB instance
 */
export function setDbInstance(customDb: NodePgDatabase<typeof schema>, customPool?: Pool) {
  dbInstance = customDb;
  if (customPool) {
    pool = customPool;
  }
}

/**
 * Runs SQL migrations and bootstraps initial admin allowlist entry
 */
export async function runMigrations(): Promise<void> {
  const currentPool = getPool();
  const client: PoolClient = await currentPool.connect();

  try {
    const migrationFile = path.resolve(__dirname, '../../migrations/0001_initial_schema.sql');
    if (fs.existsSync(migrationFile)) {
      const sqlContent = fs.readFileSync(migrationFile, 'utf8');
      await client.query(sqlContent);
      console.log('Database migration 0001_initial_schema executed successfully.');
    }

    // Seed INITIAL_ADMIN_EMAIL if configured and not present
    if (config.initialAdminEmail) {
      const normalizedEmail = config.initialAdminEmail.trim().toLowerCase();
      const existing = await client.query(
        'SELECT id FROM admin_allowlist WHERE email_normalized = $1 LIMIT 1',
        [normalizedEmail]
      );

      if (existing.rowCount === 0) {
        await client.query(
          'INSERT INTO admin_allowlist (email_normalized) VALUES ($1)',
          [normalizedEmail]
        );
        console.log(`Bootstrapped initial admin allowlist entry for: ${normalizedEmail}`);
      }
    }
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}

