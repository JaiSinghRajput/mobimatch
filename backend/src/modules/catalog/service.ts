import { eq, and, sql, desc, asc, ilike, or, ne } from 'drizzle-orm';
import { getDb } from '../../db';
import {
  brands,
  mobileModels,
  sparePartCategories,
  compatibilityGroups,
  compatibilityGroupMembers,
} from '../../db/schema';
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

  // Check if a brand with this normalized name already exists
  const existing = await db
    .select()
    .from(brands)
    .where(eq(brands.normalizedName, normalized))
    .limit(1);

  if (existing.length > 0) {
    const found = existing[0];
    if (found.isActive) {
      const err: any = new Error(`Brand "${found.name}" already exists in the catalog.`);
      err.code = 'BRAND_ALREADY_EXISTS';
      err.statusCode = 409;
      err.existingBrand = found;
      throw err;
    } else {
      // Conflict resolution: Reactivate the existing deactivated brand
      const [reactivated] = await db
        .update(brands)
        .set({
          name: trimmed,
          isActive: true,
          deactivatedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(brands.id, found.id))
        .returning();

      await invalidateCatalogCache();
      return reactivated;
    }
  }

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

  const collision = await db
    .select()
    .from(brands)
    .where(and(eq(brands.normalizedName, normalized), ne(brands.id, id)))
    .limit(1);

  if (collision.length > 0) {
    const err: any = new Error(`Another brand named "${collision[0].name}" already exists.`);
    err.code = 'BRAND_ALREADY_EXISTS';
    err.statusCode = 409;
    throw err;
  }

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

  const existing = await db
    .select()
    .from(sparePartCategories)
    .where(eq(sparePartCategories.normalizedName, normalized))
    .limit(1);

  if (existing.length > 0) {
    const found = existing[0];
    if (found.isActive) {
      const err: any = new Error(`Category "${found.name}" already exists in the catalog.`);
      err.code = 'CATEGORY_ALREADY_EXISTS';
      err.statusCode = 409;
      err.existingCategory = found;
      throw err;
    } else {
      // Conflict resolution: Reactivate the existing deactivated category
      const [reactivated] = await db
        .update(sparePartCategories)
        .set({
          name: trimmed,
          isActive: true,
          deactivatedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(sparePartCategories.id, found.id))
        .returning();

      await invalidateCatalogCache();
      return reactivated;
    }
  }

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

  const collision = await db
    .select()
    .from(sparePartCategories)
    .where(and(eq(sparePartCategories.normalizedName, normalized), ne(sparePartCategories.id, id)))
    .limit(1);

  if (collision.length > 0) {
    const err: any = new Error(`Another category named "${collision[0].name}" already exists.`);
    err.code = 'CATEGORY_ALREADY_EXISTS';
    err.statusCode = 409;
    throw err;
  }

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

  const existing = await db
    .select()
    .from(mobileModels)
    .where(and(eq(mobileModels.brandId, brandId), eq(mobileModels.normalizedName, normalized)))
    .limit(1);

  if (existing.length > 0) {
    const found = existing[0];
    if (found.isActive) {
      const err: any = new Error(`Model "${found.name}" already exists for this brand.`);
      err.code = 'MODEL_ALREADY_EXISTS';
      err.statusCode = 409;
      err.existingModel = found;
      throw err;
    } else {
      // Conflict resolution: Reactivate deactivated model
      const [reactivated] = await db
        .update(mobileModels)
        .set({
          name: trimmed,
          modelNumber: modelNumber ? modelNumber.trim() : found.modelNumber,
          isActive: true,
          deactivatedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(mobileModels.id, found.id))
        .returning();

      await invalidateCatalogCache();
      return reactivated;
    }
  }

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

  if (data.name || data.brandId) {
    const current = await db
      .select()
      .from(mobileModels)
      .where(eq(mobileModels.id, id))
      .limit(1);

    if (current.length > 0) {
      const targetBrandId = data.brandId || current[0].brandId;
      const targetName = data.name ? data.name.trim() : current[0].name;
      const targetNorm = normalizeText(targetName);

      const collision = await db
        .select()
        .from(mobileModels)
        .where(
          and(
            eq(mobileModels.brandId, targetBrandId),
            eq(mobileModels.normalizedName, targetNorm),
            ne(mobileModels.id, id)
          )
        )
        .limit(1);

      if (collision.length > 0) {
        const err: any = new Error(
          `Another model named "${collision[0].name}" already exists under this brand.`
        );
        err.code = 'MODEL_ALREADY_EXISTS';
        err.statusCode = 409;
        throw err;
      }
    }
  }

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

// ==========================================
// Conflict Resolution & Deduplication
// ==========================================

export async function autoDeduplicateBrands() {
  const db = getDb();

  // Find all brands
  const allBrands = await db
    .select()
    .from(brands)
    .orderBy(asc(brands.createdAt));

  // Group by normalizedName
  const groups: Record<string, typeof allBrands> = {};
  for (const b of allBrands) {
    if (!groups[b.normalizedName]) {
      groups[b.normalizedName] = [];
    }
    groups[b.normalizedName].push(b);
  }

  let totalMergedGroups = 0;
  let duplicatesRemoved = 0;

  for (const norm in groups) {
    const brandList = groups[norm];
    if (brandList.length <= 1) continue;

    // Count models for each brand to preserve the one with the most data
    const brandWithCounts = await Promise.all(
      brandList.map(async (b) => {
        const countRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(mobileModels)
          .where(eq(mobileModels.brandId, b.id));
        return {
          brand: b,
          modelCount: Number(countRes[0]?.count || 0),
        };
      })
    );

    // Sort: active first, then most models, then oldest created
    brandWithCounts.sort((a, b) => {
      if (a.brand.isActive !== b.brand.isActive) {
        return a.brand.isActive ? -1 : 1;
      }
      if (b.modelCount !== a.modelCount) {
        return b.modelCount - a.modelCount;
      }
      return new Date(a.brand.createdAt).getTime() - new Date(b.brand.createdAt).getTime();
    });

    const primaryBrand = brandWithCounts[0].brand;
    const secondaryBrands = brandWithCounts.slice(1).map((x) => x.brand);

    for (const sec of secondaryBrands) {
      // Migrate all models from duplicate secondary brand to primaryBrand
      const secModels = await db
        .select()
        .from(mobileModels)
        .where(eq(mobileModels.brandId, sec.id));

      for (const m2 of secModels) {
        // Check if primaryBrand already has model with this normalizedName
        const primMatch = await db
          .select()
          .from(mobileModels)
          .where(
            and(
              eq(mobileModels.brandId, primaryBrand.id),
              eq(mobileModels.normalizedName, m2.normalizedName)
            )
          )
          .limit(1);

        if (primMatch.length > 0) {
          const primModel = primMatch[0];
          // Re-point any compatibility memberships from duplicate model to primary model
          const memberships = await db
            .select()
            .from(compatibilityGroupMembers)
            .where(eq(compatibilityGroupMembers.modelId, m2.id));

          for (const mem of memberships) {
            const existingMem = await db
              .select()
              .from(compatibilityGroupMembers)
              .where(
                and(
                  eq(compatibilityGroupMembers.groupId, mem.groupId),
                  eq(compatibilityGroupMembers.modelId, primModel.id)
                )
              )
              .limit(1);

            if (existingMem.length === 0) {
              await db
                .update(compatibilityGroupMembers)
                .set({ modelId: primModel.id })
                .where(eq(compatibilityGroupMembers.id, mem.id));
            } else {
              await db
                .delete(compatibilityGroupMembers)
                .where(eq(compatibilityGroupMembers.id, mem.id));
            }
          }

          // Delete duplicate model
          await db.delete(mobileModels).where(eq(mobileModels.id, m2.id));
        } else {
          // Re-assign model to primary brand
          await db
            .update(mobileModels)
            .set({ brandId: primaryBrand.id, updatedAt: new Date() })
            .where(eq(mobileModels.id, m2.id));
        }
      }

      // Safe to delete secondary duplicate brand
      await db.delete(brands).where(eq(brands.id, sec.id));
      duplicatesRemoved++;
    }

    totalMergedGroups++;
  }

  await invalidateCatalogCache();
  return {
    success: true,
    totalMergedGroups,
    duplicatesRemoved,
  };
}

export async function autoDeduplicateCategories() {
  const db = getDb();
  const allCats = await db
    .select()
    .from(sparePartCategories)
    .orderBy(asc(sparePartCategories.createdAt));

  const groups: Record<string, typeof allCats> = {};
  for (const c of allCats) {
    if (!groups[c.normalizedName]) {
      groups[c.normalizedName] = [];
    }
    groups[c.normalizedName].push(c);
  }

  let totalMergedGroups = 0;
  let duplicatesRemoved = 0;

  for (const norm in groups) {
    const catList = groups[norm];
    if (catList.length <= 1) continue;

    catList.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const primary = catList[0];
    const secondaries = catList.slice(1);

    for (const sec of secondaries) {
      await db
        .update(compatibilityGroups)
        .set({ categoryId: primary.id, updatedAt: new Date() })
        .where(eq(compatibilityGroups.categoryId, sec.id));

      await db.delete(sparePartCategories).where(eq(sparePartCategories.id, sec.id));
      duplicatesRemoved++;
    }
    totalMergedGroups++;
  }

  await invalidateCatalogCache();
  return {
    success: true,
    totalMergedGroups,
    duplicatesRemoved,
  };
}

