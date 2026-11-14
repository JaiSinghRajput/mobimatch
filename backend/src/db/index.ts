import { Pool, PoolClient } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import * as schema from './schema';

let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

// Embedded Fallback DDL Schema to guarantee migration success even if .sql file is stripped during build
const FALLBACK_SCHEMA_SQL = `
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'uuid-ossp extension skipped or already exists';
END $$;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    city TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    privacy_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_idx ON users(google_sub);

-- 2. Admin Allowlist
CREATE TABLE IF NOT EXISTS admin_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_normalized TEXT UNIQUE NOT NULL,
    added_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_allowlist_email_normalized_idx ON admin_allowlist(email_normalized);

-- 3. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT UNIQUE NOT NULL,
    device_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_refresh_token_hash_idx ON sessions(refresh_token_hash);

-- 4. Brands
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS brands_normalized_name_idx ON brands(normalized_name);

-- 5. Mobile Models
CREATE TABLE IF NOT EXISTS mobile_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    model_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS mobile_models_brand_id_idx ON mobile_models(brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS mobile_models_brand_norm_idx ON mobile_models(brand_id, normalized_name);
CREATE INDEX IF NOT EXISTS mobile_models_number_idx ON mobile_models(model_number);

-- 6. Spare Part Categories
CREATE TABLE IF NOT EXISTS spare_part_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS spare_part_categories_norm_idx ON spare_part_categories(normalized_name);

-- 7. Compatibility Groups
CREATE TABLE IF NOT EXISTS compatibility_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES spare_part_categories(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS compatibility_groups_category_id_idx ON compatibility_groups(category_id);

-- 8. Compatibility Group Members
CREATE TABLE IF NOT EXISTS compatibility_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES compatibility_groups(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES mobile_models(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_model_unique_idx ON compatibility_group_members(group_id, model_id);
CREATE INDEX IF NOT EXISTS group_members_model_id_idx ON compatibility_group_members(model_id);

-- 9. Issue Reports
CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    category_id UUID REFERENCES spare_part_categories(id) ON DELETE SET NULL,
    model_id UUID REFERENCES mobile_models(id) ON DELETE SET NULL,
    group_id UUID REFERENCES compatibility_groups(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS issue_reports_user_id_idx ON issue_reports(user_id);
CREATE INDEX IF NOT EXISTS issue_reports_status_idx ON issue_reports(status);

-- 10. Model Requests
CREATE TABLE IF NOT EXISTS model_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    brand_name_submitted TEXT NOT NULL,
    model_name_submitted TEXT NOT NULL,
    model_number_submitted TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS model_requests_user_id_idx ON model_requests(user_id);
CREATE INDEX IF NOT EXISTS model_requests_status_idx ON model_requests(status);
`;

export function getPool(): Pool {
  if (!pool) {
    // Cloud database providers (Render, Supabase, Neon, Railway) require SSL
    const isExplicitlyDisabled =
      process.env.DATABASE_SSL === 'false' ||
      config.databaseUrl.includes('sslmode=disable');

    const isLocal =
      config.databaseUrl.includes('localhost') ||
      config.databaseUrl.includes('127.0.0.1');

    const isSslRequired =
      !isExplicitlyDisabled &&
      !isLocal &&
      (process.env.NODE_ENV === 'production' ||
        process.env.DATABASE_SSL === 'true' ||
        config.databaseUrl.includes('sslmode=require') ||
        config.databaseUrl.includes('ssl=true') ||
        config.databaseUrl.includes('render.com') ||
        config.databaseUrl.includes('dpg-') ||
        config.databaseUrl.includes('neon.tech') ||
        config.databaseUrl.includes('supabase.co'));

    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
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
 * Finds migration SQL from filesystem or falls back to embedded SQL
 */
function getMigrationSql(): string {
  const candidatePaths = [
    path.resolve(__dirname, '../../migrations/0001_initial_schema.sql'),
    path.resolve(__dirname, '../migrations/0001_initial_schema.sql'),
    path.resolve(__dirname, './migrations/0001_initial_schema.sql'),
    path.resolve(process.cwd(), 'migrations/0001_initial_schema.sql'),
    path.resolve(process.cwd(), 'backend/migrations/0001_initial_schema.sql'),
    path.resolve(process.cwd(), 'dist/migrations/0001_initial_schema.sql'),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf8');
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Use embedded SQL fallback if no file is found
  return FALLBACK_SCHEMA_SQL;
}

/**
 * Runs SQL migrations with automatic retry and bootstraps initial admin allowlist entry
 */
export async function runMigrations(): Promise<void> {
  const currentPool = getPool();
  let client: PoolClient | null = null;

  // Retry connection up to 5 times (helps with cold-starts on Render / cloud DBs)
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      client = await currentPool.connect();
      break;
    } catch (err: any) {
      if (attempt === maxAttempts) {
        console.error(`Failed to connect to database after ${maxAttempts} attempts:`, err.message);
        throw err;
      }
      const delayMs = attempt * 1500;
      console.warn(`Database connection attempt ${attempt}/${maxAttempts} failed (${err.message}). Retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  if (!client) {
    throw new Error('Could not obtain PostgreSQL client');
  }

  try {
    const sqlContent = getMigrationSql();
    await client.query(sqlContent);
    console.log('Database migration 0001_initial_schema executed successfully.');

    // 1. Conflict Resolution & Auto-Deduplication: Brands
    // Merge any duplicate brands created before unique constraint was enforced
    await client.query(`
      DO $$
      DECLARE
          r RECORD;
          primary_id UUID;
          dup_id UUID;
      BEGIN
          FOR r IN (
              SELECT normalized_name, COUNT(*) 
              FROM brands 
              GROUP BY normalized_name 
              HAVING COUNT(*) > 1
          ) LOOP
              SELECT id INTO primary_id 
              FROM brands 
              WHERE normalized_name = r.normalized_name 
              ORDER BY is_active DESC, created_at ASC 
              LIMIT 1;

              FOR dup_id IN (
                  SELECT id 
                  FROM brands 
                  WHERE normalized_name = r.normalized_name AND id != primary_id
              ) LOOP
                  UPDATE mobile_models SET brand_id = primary_id WHERE brand_id = dup_id;
                  DELETE FROM brands WHERE id = dup_id;
              END LOOP;
          END LOOP;
      END $$;
    `);

    // Ensure Unique Index on brands(normalized_name)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS brands_normalized_name_idx ON brands(normalized_name);
    `);

    // 2. Conflict Resolution & Auto-Deduplication: Mobile Models per brand
    await client.query(`
      DO $$
      DECLARE
          r RECORD;
          primary_id UUID;
          dup_id UUID;
      BEGIN
          FOR r IN (
              SELECT brand_id, normalized_name, COUNT(*) 
              FROM mobile_models 
              GROUP BY brand_id, normalized_name 
              HAVING COUNT(*) > 1
          ) LOOP
              SELECT id INTO primary_id 
              FROM mobile_models 
              WHERE brand_id = r.brand_id AND normalized_name = r.normalized_name 
              ORDER BY is_active DESC, created_at ASC 
              LIMIT 1;

              FOR dup_id IN (
                  SELECT id 
                  FROM mobile_models 
                  WHERE brand_id = r.brand_id AND normalized_name = r.normalized_name AND id != primary_id
              ) LOOP
                  UPDATE compatibility_group_members SET model_id = primary_id WHERE model_id = dup_id;
                  DELETE FROM mobile_models WHERE id = dup_id;
              END LOOP;
          END LOOP;
      END $$;
    `);

    // Ensure Unique Index on mobile_models(brand_id, normalized_name)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS mobile_models_brand_norm_idx ON mobile_models(brand_id, normalized_name);
    `);

    // Seed INITIAL_ADMIN_EMAIL if configured and not present
    if (config.initialAdminEmail) {
      const normalizedEmail = config.initialAdminEmail.trim().toLowerCase();
      const existing = await client.query(
        'SELECT id FROM admin_allowlist WHERE email_normalized = $1 LIMIT 1',
        [normalizedEmail]
      );

      if (existing.rowCount === 0) {
        await client.query(
          'INSERT INTO admin_allowlist (email_normalized) VALUES ($1) ON CONFLICT (email_normalized) DO NOTHING',
          [normalizedEmail]
        );
        console.log(`Bootstrapped initial admin allowlist entry for: ${normalizedEmail}`);
      }
    }

    // 3. Ad Settings & Custom Banners Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS ad_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ads_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          ad_provider TEXT NOT NULL DEFAULT 'admob',
          admob_app_id TEXT NOT NULL DEFAULT 'ca-app-pub-3940256099942544~3347511713',
          admob_banner_id TEXT NOT NULL DEFAULT 'ca-app-pub-3940256099942544/6300978111',
          admob_interstitial_id TEXT NOT NULL DEFAULT 'ca-app-pub-3940256099942544/1033173712',
          admob_rewarded_id TEXT NOT NULL DEFAULT 'ca-app-pub-3940256099942544/5224354917',
          show_on_home BOOLEAN NOT NULL DEFAULT TRUE,
          show_on_results BOOLEAN NOT NULL DEFAULT TRUE,
          show_on_catalog BOOLEAN NOT NULL DEFAULT TRUE,
          banner_refresh_interval_sec INTEGER NOT NULL DEFAULT 30,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS custom_banners (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          image_url TEXT,
          target_url TEXT NOT NULL,
          placement TEXT NOT NULL DEFAULT 'all',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          click_count INTEGER NOT NULL DEFAULT 0,
          impression_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Ensure initial ad_settings row exists
    const adSettingsCheck = await client.query('SELECT id FROM ad_settings LIMIT 1');
    if (adSettingsCheck.rowCount === 0) {
      await client.query(`
        INSERT INTO ad_settings (
          ads_enabled, ad_provider, admob_app_id, admob_banner_id, admob_interstitial_id, admob_rewarded_id, show_on_home, show_on_results, show_on_catalog
        ) VALUES (
          true, 'admob', 'ca-app-pub-3940256099942544~3347511713', 'ca-app-pub-3940256099942544/6300978111', 'ca-app-pub-3940256099942544/1033173712', 'ca-app-pub-3940256099942544/5224354917', true, true, true
        )
      `);
      console.log('Bootstrapped initial AdMob advertisement settings.');
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
