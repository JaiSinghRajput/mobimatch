import { getPool, runMigrations, closeDb } from './index';
import { config } from '../config';

/**
 * Production Seed Script
 * 
 * Ensures all database migrations are applied and the primary administrator
 * is allowlisted. Does NOT insert any dummy brands, models, categories, or
 * compatibility groups so the administrator has full control over catalog data.
 */
export async function seedInitialData() {
  console.log('--- Initializing MobiMatch Production Database ---');

  // 1. Run migrations to ensure all 10 tables and indexes exist
  await runMigrations();

  const pool = getPool();
  const client = await pool.connect();

  try {
    // 2. Ensure initial administrator is registered in admin_allowlist
    const adminEmail = (config.initialAdminEmail || 'admin@mobimatch.local').trim().toLowerCase();

    const existingAdmin = await client.query(
      'SELECT id FROM admin_allowlist WHERE email_normalized = $1 LIMIT 1',
      [adminEmail]
    );

    if (existingAdmin.rowCount === 0) {
      await client.query(
        'INSERT INTO admin_allowlist (email_normalized) VALUES ($1)',
        [adminEmail]
      );
      console.log(`✓ Bootstrapped primary admin allowlist entry: ${adminEmail}`);
    } else {
      console.log(`✓ Primary admin allowlist entry already present: ${adminEmail}`);
    }

    // 3. Confirm clean database state
    const brandsCount = await client.query('SELECT COUNT(*) FROM brands');
    const categoriesCount = await client.query('SELECT COUNT(*) FROM spare_part_categories');
    const modelsCount = await client.query('SELECT COUNT(*) FROM mobile_models');
    const groupsCount = await client.query('SELECT COUNT(*) FROM compatibility_groups');

    console.log('\n--- Catalog Status Summary ---');
    console.log(`• Brands:               ${brandsCount.rows[0].count}`);
    console.log(`• Spare Part Categories:${categoriesCount.rows[0].count}`);
    console.log(`• Mobile Models:        ${modelsCount.rows[0].count}`);
    console.log(`• Compatibility Groups: ${groupsCount.rows[0].count}`);
    console.log('------------------------------');
    console.log('✓ Database is initialized and clean (no dummy catalog data).');
    console.log(`✓ Administrator (${adminEmail}) can log in via Admin App to populate catalog.\n`);
  } finally {
    client.release();
    await closeDb();
  }
}

if (require.main === module) {
  seedInitialData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
