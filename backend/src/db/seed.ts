import { getPool, runMigrations, closeDb } from './index';
import { normalizeText } from '@mobimatch/api-contracts';

export async function seedInitialData() {
  await runMigrations();
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('Seeding initial MobiMatch catalog and compatibility data...');

    // 1. Initial Brands
    const brandNames = [
      'Apple',
      'Motorola',
      'OnePlus',
      'Oppo',
      'Poco',
      'Realme',
      'Redmi',
      'Samsung',
      'Vivo',
      'Xiaomi',
    ];

    const brandIds: Record<string, string> = {};
    for (const name of brandNames) {
      const norm = normalizeText(name);
      const res = await client.query(
        `INSERT INTO brands (name, normalized_name, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [name, norm]
      );
      if (res.rowCount && res.rowCount > 0) {
        brandIds[name] = res.rows[0].id;
      } else {
        const existing = await client.query(
          'SELECT id FROM brands WHERE normalized_name = $1',
          [norm]
        );
        brandIds[name] = existing.rows[0].id;
      }
    }

    // 2. Initial Spare Part Categories
    const categories = [
      'Back Panel / Housing',
      'Battery',
      'Camera Glass / Lens',
      'Charging Port / Flex Cable',
      'Display / LCD + Touch Screen',
      'Earpiece Speaker',
      'Loudspeaker / Ringer',
      'Main Motherboard Flex Cable',
    ];

    const categoryIds: Record<string, string> = {};
    for (const name of categories) {
      const norm = normalizeText(name);
      const res = await client.query(
        `INSERT INTO spare_part_categories (name, normalized_name, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (normalized_name) DO NOTHING
         RETURNING id`,
        [name, norm]
      );
      if (res.rowCount && res.rowCount > 0) {
        categoryIds[name] = res.rows[0].id;
      } else {
        const existing = await client.query(
          'SELECT id FROM spare_part_categories WHERE normalized_name = $1',
          [norm]
        );
        categoryIds[name] = existing.rows[0].id;
      }
    }

    // 3. Initial Mobile Models
    const modelsToInsert = [
      { brand: 'Redmi', name: 'Note 10', number: 'M2101K7AI' },
      { brand: 'Redmi', name: 'Note 10S', number: 'M2101K7BI' },
      { brand: 'Redmi', name: 'Note 11', number: '2201117TI' },
      { brand: 'Redmi', name: '9', number: 'M2006C3MII' },
      { brand: 'Poco', name: 'M2', number: 'MZB9919IN' },
      { brand: 'Samsung', name: 'Galaxy A52', number: 'SM-A525F' },
      { brand: 'Samsung', name: 'Galaxy A52s', number: 'SM-A528B' },
      { brand: 'Poco', name: 'X3', number: 'MZB07Z0IN' },
      { brand: 'Poco', name: 'X3 Pro', number: 'M2102J20SI' },
    ];

    const modelIds: Record<string, string> = {};
    for (const m of modelsToInsert) {
      const bId = brandIds[m.brand];
      const norm = normalizeText(m.name);
      const key = `${m.brand} ${m.name}`;

      const res = await client.query(
        `INSERT INTO mobile_models (brand_id, name, normalized_name, model_number, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [bId, m.name, norm, m.number]
      );
      modelIds[key] = res.rows[0].id;
    }

    // 4. Initial Compatibility Groups
    const displayCatId = categoryIds['Display / LCD + Touch Screen'];
    if (displayCatId) {
      // Group 1: Redmi Note 10 = Redmi Note 10S = Redmi Note 11
      const g1Res = await client.query(
        `INSERT INTO compatibility_groups (category_id, is_active)
         VALUES ($1, true)
         RETURNING id`,
        [displayCatId]
      );
      const g1Id = g1Res.rows[0].id;

      for (const name of ['Redmi Note 10', 'Redmi Note 10S', 'Redmi Note 11']) {
        const mId = modelIds[name];
        if (mId) {
          await client.query(
            `INSERT INTO compatibility_group_members (group_id, model_id) VALUES ($1, $2)`,
            [g1Id, mId]
          );
        }
      }

      // Group 2: Samsung Galaxy A52 = Samsung Galaxy A52s
      const g2Res = await client.query(
        `INSERT INTO compatibility_groups (category_id, is_active)
         VALUES ($1, true)
         RETURNING id`,
        [displayCatId]
      );
      const g2Id = g2Res.rows[0].id;

      for (const name of ['Samsung Galaxy A52', 'Samsung Galaxy A52s']) {
        const mId = modelIds[name];
        if (mId) {
          await client.query(
            `INSERT INTO compatibility_group_members (group_id, model_id) VALUES ($1, $2)`,
            [g2Id, mId]
          );
        }
      }

      // Group 3: Redmi 9 = Poco M2
      const g3Res = await client.query(
        `INSERT INTO compatibility_groups (category_id, is_active)
         VALUES ($1, true)
         RETURNING id`,
        [displayCatId]
      );
      const g3Id = g3Res.rows[0].id;

      for (const name of ['Redmi 9', 'Poco M2']) {
        const mId = modelIds[name];
        if (mId) {
          await client.query(
            `INSERT INTO compatibility_group_members (group_id, model_id) VALUES ($1, $2)`,
            [g3Id, mId]
          );
        }
      }
    }

    // Group 4: Charging Flex - Poco X3 = Poco X3 Pro
    const chargingCatId = categoryIds['Charging Port / Flex Cable'];
    if (chargingCatId) {
      const g4Res = await client.query(
        `INSERT INTO compatibility_groups (category_id, is_active)
         VALUES ($1, true)
         RETURNING id`,
        [chargingCatId]
      );
      const g4Id = g4Res.rows[0].id;

      for (const name of ['Poco X3', 'Poco X3 Pro']) {
        const mId = modelIds[name];
        if (mId) {
          await client.query(
            `INSERT INTO compatibility_group_members (group_id, model_id) VALUES ($1, $2)`,
            [g4Id, mId]
          );
        }
      }
    }

    console.log('Database seeded successfully with initial MobiMatch data.');
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

