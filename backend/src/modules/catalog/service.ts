import { eq, and, sql, desc, asc, ilike, or } from 'drizzle-orm';
import { getDb } from '../../db';
import { brands, mobileModels, sparePartCategories } from '../../db/schema';
import {
  getCache,
  setCache,
  invalidateCatalogCache,
} from '../../cache';
import { normalizeText } from '@mobimatch/api-contracts';

// ==========================================
// Brands Service
// ==========================================

export async function getActiveBrands() {
  const cacheKey = 'mobimatch:brands';
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const db = getDb();
  const result = await db
    .select({
      id: brands.id,
      name: brands.name,
      normalizedName: brands.normalizedName,
      isActive: brands.isActive,
      createdAt: brands.createdAt,
    })
    .from(brands)
    .where(eq(brands.isActive, true))
    .orderBy(asc(brands.name));

  await setCache(cacheKey, result, 600); // 10 mins cache
  return result;
}

export async function getAllBrandsAdmin() {
  const db = getDb();
  return db
    .select()
    .from(brands)
    .orderBy(asc(brands.name));
}

export async function createBrand(name: string) {
  const db = getDb();
  const trimmed = name.trim();
  const normalized = normalizeText(trimmed);

  const [created] = await db
    .insert(brands)
    .values({
      name: trimmed,
      normalizedName: normalized,
      isActive: true,
    })
    .returning();

  await invalidateCatalogCache();
  return created;
}

export async function updateBrand(id: string, name: string) {
  const db = getDb();
  const trimmed = name.trim();
  const normalized = normalizeText(trimmed);

  const [updated] = await db
    .update(brands)
    .set({
      name: trimmed,
      normalizedName: normalized,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, id))
    .returning();

  await invalidateCatalogCache();
  return updated;
}

export async function setBrandActiveStatus(id: string, isActive: boolean) {
  const db = getDb();
  const [updated] = await db
    .update(brands)
    .set({
      isActive,
      deactivatedAt: isActive ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(brands.id, id))
    .returning();

  await invalidateCatalogCache();
  return updated;
}

// ==========================================
// Categories Service
// ==========================================

export async function getActiveCategories() {
  const cacheKey = 'mobimatch:categories';
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const db = getDb();
  const result = await db
    .select({
      id: sparePartCategories.id,
      name: sparePartCategories.name,
      normalizedName: sparePartCategories.normalizedName,
      isActive: sparePartCategories.isActive,
      createdAt: sparePartCategories.createdAt,
    })
    .from(sparePartCategories)
    .where(eq(sparePartCategories.isActive, true))
    .orderBy(asc(sparePartCategories.name));

  await setCache(cacheKey, result, 600);
  return result;
}

export async function getAllCategoriesAdmin() {
  const db = getDb();
  return db
    .select()
    .from(sparePartCategories)
    .orderBy(asc(sparePartCategories.name));
}

export async function createCategory(name: string) {
  const db = getDb();
  const trimmed = name.trim();
  const normalized = normalizeText(trimmed);

  const [created] = await db
    .insert(sparePartCategories)
    .values({
      name: trimmed,
      normalizedName: normalized,
      isActive: true,
    })
    .returning();

  await invalidateCatalogCache();
  return created;
}

export async function updateCategory(id: string, name: string) {
  const db = getDb();
  const trimmed = name.trim();
  const normalized = normalizeText(trimmed);

  const [updated] = await db
    .update(sparePartCategories)
    .set({
      name: trimmed,
      normalizedName: normalized,
      updatedAt: new Date(),
    })
    .where(eq(sparePartCategories.id, id))
    .returning();

  await invalidateCatalogCache();
  return updated;
}

export async function setCategoryActiveStatus(id: string, isActive: boolean) {
  const db = getDb();
  const [updated] = await db
    .update(sparePartCategories)
    .set({
      isActive,
      deactivatedAt: isActive ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sparePartCategories.id, id))
    .returning();

  await invalidateCatalogCache();
  return updated;
}

// ==========================================
// Models & Search Service
// ==========================================

export async function getActiveModelsByBrand(brandId: string) {
  const cacheKey = `mobimatch:brand-models:${brandId}`;
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const db = getDb();
  const result = await db
    .select({
      id: mobileModels.id,
      brandId: mobileModels.brandId,
      name: mobileModels.name,
      normalizedName: mobileModels.normalizedName,
      modelNumber: mobileModels.modelNumber,
      isActive: mobileModels.isActive,
    })
    .from(mobileModels)
    .where(
      and(
        eq(mobileModels.brandId, brandId),
        eq(mobileModels.isActive, true)
      )
    )
    .orderBy(asc(mobileModels.name));

  await setCache(cacheKey, result, 600);
  return result;
}

export async function getAllModelsAdmin() {
  const db = getDb();
  return db
    .select({
      id: mobileModels.id,
      brandId: mobileModels.brandId,
      brandName: brands.name,
      name: mobileModels.name,
      modelNumber: mobileModels.modelNumber,
      isActive: mobileModels.isActive,
      createdAt: mobileModels.createdAt,
      updatedAt: mobileModels.updatedAt,
      deactivatedAt: mobileModels.deactivatedAt,
    })
    .from(mobileModels)
    .innerJoin(brands, eq(mobileModels.brandId, brands.id))
    .orderBy(asc(brands.name), asc(mobileModels.name));
}

export async function createModel(brandId: string, name: string, modelNumber?: string | null) {
  const db = getDb();
  const trimmed = name.trim();
  const normalized = normalizeText(trimmed);

  const [created] = await db
    .insert(mobileModels)
    .values({
      brandId,
      name: trimmed,
      normalizedName: normalized,
      modelNumber: modelNumber ? modelNumber.trim() : null,
      isActive: true,
    })
    .returning();

  await invalidateCatalogCache();
  return created;
}

export async function updateModel(
  id: string,
  data: { brandId?: string; name?: string; modelNumber?: string | null }
) {
  const db = getDb();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.brandId) updateData.brandId = data.brandId;
  if (data.name) {
    updateData.name = data.name.trim();
    updateData.normalizedName = normalizeText(data.name);
  }
  if (data.modelNumber !== undefined) {
    updateData.modelNumber = data.modelNumber ? data.modelNumber.trim() : null;
  }

  const [updated] = await db
    .update(mobileModels)
    .set(updateData)
    .where(eq(mobileModels.id, id))
    .returning();

  await invalidateCatalogCache();
  return updated;
}

export async function setModelActiveStatus(id: string, isActive: boolean) {
  const db = getDb();
  const [updated] = await db
    .update(mobileModels)
    .set({
      isActive,
      deactivatedAt: isActive ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(mobileModels.id, id))
    .returning();

  await invalidateCatalogCache();
  return updated;
}

export async function searchActiveModels(query: string, limit = 20) {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const normalized = normalizeText(trimmed);
  const cacheKey = `mobimatch:search:${normalized}:${limit}`;
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const db = getDb();
  const pattern = `%${normalized}%`;

  // Matches brand name, model name, or model number
  const results = await db
    .select({
      id: mobileModels.id,
      name: mobileModels.name,
      brandId: brands.id,
      brandName: brands.name,
      modelNumber: mobileModels.modelNumber,
    })
    .from(mobileModels)
    .innerJoin(brands, eq(mobileModels.brandId, brands.id))
    .where(
      and(
        eq(mobileModels.isActive, true),
        eq(brands.isActive, true),
        or(
          ilike(mobileModels.name, pattern),
          ilike(brands.name, pattern),
          ilike(mobileModels.modelNumber, pattern),
          ilike(sql`concat(${brands.name}, ' ', ${mobileModels.name})`, pattern)
        )
      )
    )
    .orderBy(asc(brands.name), asc(mobileModels.name))
    .limit(limit);

  await setCache(cacheKey, results, 120); // 2 mins search cache
  return results;
}
