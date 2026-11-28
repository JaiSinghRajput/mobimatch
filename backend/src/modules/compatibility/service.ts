import { eq, and, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb, getPool } from '../../db';
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
import {
  parseCompatibilityText,
  normalizeText,
  CompatibilityResult,
  ParsePreviewResponse,
  PublishCompatibilityRequest,
  ConflictItem,
  ResolvedModelMatch,
} from '@mobimatch/api-contracts';

// In-memory preview store for preview validation binding
const previewStore = new Map<string, { categoryId: string; timestamp: number }>();

// ==========================================
// User Compatibility Resolution
// ==========================================

export async function getCompatibilityResult(
  modelId: string,
  categoryId: string
): Promise<CompatibilityResult | null> {
  const cacheKey = `mobimatch:compat:${categoryId}:${modelId}`;
  const cached = await getCache<CompatibilityResult>(cacheKey);
  if (cached) return cached;

  const db = getDb();

  // 1. Verify category is active
  const categoryList = await db
    .select()
    .from(sparePartCategories)
    .where(
      and(
        eq(sparePartCategories.id, categoryId),
        eq(sparePartCategories.isActive, true)
      )
    )
    .limit(1);

  if (categoryList.length === 0) return null;
  const category = categoryList[0];

  // 2. Verify selected model is active
  const modelList = await db
    .select({
      modelId: mobileModels.id,
      modelName: mobileModels.name,
      brandId: brands.id,
      brandName: brands.name,
      modelNumber: mobileModels.modelNumber,
    })
    .from(mobileModels)
    .innerJoin(brands, eq(mobileModels.brandId, brands.id))
    .where(
      and(
        eq(mobileModels.id, modelId),
        eq(mobileModels.isActive, true),
        eq(brands.isActive, true)
      )
    )
    .limit(1);

  if (modelList.length === 0) return null;
  const selectedModel = modelList[0];

  // 3. Find active compatibility group for this model and category
  const groupMembership = await db
    .select({
      groupId: compatibilityGroupMembers.groupId,
    })
    .from(compatibilityGroupMembers)
    .innerJoin(
      compatibilityGroups,
      eq(compatibilityGroupMembers.groupId, compatibilityGroups.id)
    )
    .where(
      and(
        eq(compatibilityGroupMembers.modelId, modelId),
        eq(compatibilityGroups.categoryId, categoryId),
        eq(compatibilityGroups.isActive, true)
      )
    )
    .limit(1);

  if (groupMembership.length === 0) {
    return null; // No compatibility information found
  }

  const groupId = groupMembership[0].groupId;

  // 4. Fetch all active member models in this group
  const memberModels = await db
    .select({
      modelId: mobileModels.id,
      modelName: mobileModels.name,
      brandId: brands.id,
      brandName: brands.name,
      modelNumber: mobileModels.modelNumber,
    })
    .from(compatibilityGroupMembers)
    .innerJoin(mobileModels, eq(compatibilityGroupMembers.modelId, mobileModels.id))
    .innerJoin(brands, eq(mobileModels.brandId, brands.id))
    .where(
      and(
        eq(compatibilityGroupMembers.groupId, groupId),
        eq(mobileModels.isActive, true),
        eq(brands.isActive, true)
      )
    )
    .orderBy(brands.name, mobileModels.name);

  const result: CompatibilityResult = {
    categoryId: category.id,
    categoryName: category.name,
    selectedModel,
    groupId,
    totalCount: memberModels.length,
    models: memberModels,
  };

  await setCache(cacheKey, result, 300); // 5 mins cache
  return result;
}

// ==========================================
// Admin Bulk Parser Preview
// ==========================================

export async function generateParsePreview(
  categoryId: string,
  rawText: string
): Promise<ParsePreviewResponse> {
  const db = getDb();

  // Validate category
  const categoryList = await db
    .select()
    .from(sparePartCategories)
    .where(eq(sparePartCategories.id, categoryId))
    .limit(1);

  if (categoryList.length === 0) {
    throw new Error('Category not found');
  }
  const category = categoryList[0];

  // Load all active brands and models
  const allBrands = await db.select().from(brands);
  const brandNames = allBrands.map((b) => b.name);
  const brandMap = new Map(allBrands.map((b) => [b.normalizedName, b]));

  const allModels = await db
    .select({
      id: mobileModels.id,
      brandId: mobileModels.brandId,
      name: mobileModels.name,
      normalizedName: mobileModels.normalizedName,
      modelNumber: mobileModels.modelNumber,
      isActive: mobileModels.isActive,
      createdAt: mobileModels.createdAt,
      updatedAt: mobileModels.updatedAt,
      deactivatedAt: mobileModels.deactivatedAt,
    })
    .from(mobileModels);

  // Parse text using our engine
  const parseResult = parseCompatibilityText(rawText, brandNames);

  const previewLines: ParsePreviewResponse['lines'] = [];
  const missingBrandsSet = new Set<string>();
  const missingModelsMap = new Map<string, { brandName: string; modelName: string }>();
  const ambiguousModelsList: ParsePreviewResponse['ambiguousModels'] = [];
  const conflictsList: ConflictItem[] = [];

  for (const line of parseResult.lines) {
    if (!line.isValid) {
      previewLines.push({
        lineNumber: line.lineNumber,
        rawLine: line.rawLine,
        models: [],
        valid: false,
        errorMessage: line.error,
      });
      continue;
    }

    const resolvedModels: ResolvedModelMatch[] = [];

    for (const token of line.tokens) {
      // 1. If brandHint is extracted
      if (token.brandHint) {
        const brandObj = brandMap.get(normalizeText(token.brandHint));
        if (!brandObj) {
          missingBrandsSet.add(token.brandHint);
          resolvedModels.push({
            rawInput: token.raw,
            status: 'missing_brand',
            suggestedBrandName: token.brandHint,
            suggestedModelName: token.modelNameHint,
          });
          continue;
        }

        // Match model within this brand
        const normModelName = normalizeText(token.modelNameHint);
        const matched = allModels.find(
          (m) => m.brandId === brandObj.id && m.normalizedName === normModelName
        );

        if (matched) {
          resolvedModels.push({
            rawInput: token.raw,
            status: 'matched',
            matchedModel: {
              ...matched,
              createdAt: matched.createdAt.toISOString(),
              updatedAt: matched.updatedAt.toISOString(),
              deactivatedAt: matched.deactivatedAt ? matched.deactivatedAt.toISOString() : null,
            },
          });
        } else {
          missingModelsMap.set(`${brandObj.name}:${token.modelNameHint}`, {
            brandName: brandObj.name,
            modelName: token.modelNameHint,
          });
          resolvedModels.push({
            rawInput: token.raw,
            status: 'missing_model',
            suggestedBrandName: brandObj.name,
            suggestedModelName: token.modelNameHint,
          });
        }
      } else {
        // No brand hint: search across all models
        const candidates = allModels.filter(
          (m) => m.normalizedName === token.normalized
        );

        if (candidates.length === 1) {
          const c = candidates[0];
          resolvedModels.push({
            rawInput: token.raw,
            status: 'matched',
            matchedModel: {
              ...c,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
              deactivatedAt: c.deactivatedAt ? c.deactivatedAt.toISOString() : null,
            },
          });
        } else if (candidates.length > 1) {
          ambiguousModelsList.push({
            rawInput: token.raw,
            candidates: candidates.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
              deactivatedAt: c.deactivatedAt ? c.deactivatedAt.toISOString() : null,
            })),
          });
          resolvedModels.push({
            rawInput: token.raw,
            status: 'ambiguous',
            candidateModels: candidates.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
              deactivatedAt: c.deactivatedAt ? c.deactivatedAt.toISOString() : null,
            })),
          });
        } else {
          // Check if first word is a possible new brand
          const parts = token.raw.trim().split(/\s+/);
          const firstWord = parts[0];
          const rest = parts.slice(1).join(' ');

          missingBrandsSet.add(firstWord);
          resolvedModels.push({
            rawInput: token.raw,
            status: 'missing_brand',
            suggestedBrandName: firstWord,
            suggestedModelName: rest || token.raw,
          });
        }
      }
    }

    // Check conflicts for matched models in this line
    for (const res of resolvedModels) {
      if (res.status === 'matched' && res.matchedModel) {
        const existingMemberships = await db
          .select({
            groupId: compatibilityGroupMembers.groupId,
          })
          .from(compatibilityGroupMembers)
          .innerJoin(
            compatibilityGroups,
            eq(compatibilityGroupMembers.groupId, compatibilityGroups.id)
          )
          .where(
            and(
              eq(compatibilityGroupMembers.modelId, res.matchedModel.id),
              eq(compatibilityGroups.categoryId, categoryId),
              eq(compatibilityGroups.isActive, true)
            )
          )
          .limit(1);

        if (existingMemberships.length > 0) {
          const existingGroupId = existingMemberships[0].groupId;
          const countRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(compatibilityGroupMembers)
            .where(eq(compatibilityGroupMembers.groupId, existingGroupId));

          const brandObj = allBrands.find((b) => b.id === res.matchedModel?.brandId);

          conflictsList.push({
            modelId: res.matchedModel.id,
            modelName: res.matchedModel.name,
            brandName: brandObj ? brandObj.name : 'Unknown',
            existingGroupId,
            proposedLineNumber: line.lineNumber,
            existingGroupMemberCount: Number(countRes[0]?.count || 0),
          });
        }
      }
    }

    previewLines.push({
      lineNumber: line.lineNumber,
      rawLine: line.rawLine,
      models: resolvedModels,
      valid: true,
    });
  }

  const previewId = uuidv4();
  previewStore.set(previewId, { categoryId, timestamp: Date.now() });

  const hasParseErrors = parseResult.hasErrors;
  const hasMissing = missingBrandsSet.size > 0 || missingModelsMap.size > 0;
  const hasAmbiguous = ambiguousModelsList.length > 0;
  const hasConflicts = conflictsList.length > 0;

  const canPublishImmediately =
    !hasParseErrors && !hasMissing && !hasAmbiguous && !hasConflicts;

  return {
    previewId,
    categoryId: category.id,
    categoryName: category.name,
    lines: previewLines,
    totalGroups: parseResult.validGroupsCount,
    missingBrands: Array.from(missingBrandsSet),
    missingModels: Array.from(missingModelsMap.values()),
    ambiguousModels: ambiguousModelsList,
    conflicts: conflictsList,
    canPublishImmediately,
  };
}

// ==========================================
// Admin Atomic Transaction Publish
// ==========================================

export async function publishCompatibilityTransaction(
  adminUserId: string,
  request: PublishCompatibilityRequest
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify category exists
    const catCheck = await client.query(
      'SELECT id, name FROM spare_part_categories WHERE id = $1 LIMIT 1',
      [request.categoryId]
    );
    if (catCheck.rowCount === 0) {
      throw new Error('Selected category does not exist');
    }

    let createdGroupsCount = 0;
    let createdMembersCount = 0;

    for (const line of request.lines) {
      const resolvedModelIds: string[] = [];

      for (const modelItem of line.models) {
        let modelId = modelItem.resolvedModelId;

        // If model needs creation
        if (!modelId && modelItem.createIfMissing) {
          const normBrand = normalizeText(modelItem.brandName);
          let brandRes = await client.query(
            'SELECT id FROM brands WHERE normalized_name = $1 LIMIT 1',
            [normBrand]
          );

          let brandId: string;
          if (brandRes.rowCount === 0) {
            const newBrand = await client.query(
              'INSERT INTO brands (name, normalized_name, is_active) VALUES ($1, $2, true) RETURNING id',
              [modelItem.brandName.trim(), normBrand]
            );
            brandId = newBrand.rows[0].id;
          } else {
            brandId = brandRes.rows[0].id;
          }

          const normModel = normalizeText(modelItem.modelName);
          let modelRes = await client.query(
            'SELECT id FROM mobile_models WHERE brand_id = $1 AND normalized_name = $2 LIMIT 1',
            [brandId, normModel]
          );

          if (modelRes.rowCount === 0) {
            const newModel = await client.query(
              'INSERT INTO mobile_models (brand_id, name, normalized_name, model_number, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id',
              [
                brandId,
                modelItem.modelName.trim(),
                normModel,
                modelItem.modelNumber || null,
              ]
            );
            modelId = newModel.rows[0].id;
          } else {
            modelId = modelRes.rows[0].id;
          }
        }

        if (!modelId) {
          throw new Error(
            `Cannot publish: model '${modelItem.modelName}' could not be resolved or confirmed.`
          );
        }

        // Handle conflict resolution if exists
        const conflictRes = await client.query(
          `SELECT cgm.id, cgm.group_id 
           FROM compatibility_group_members cgm
           JOIN compatibility_groups cg ON cgm.group_id = cg.id
           WHERE cgm.model_id = $1 AND cg.category_id = $2 AND cg.is_active = true`,
          [modelId, request.categoryId]
        );

        if (conflictRes.rowCount && conflictRes.rowCount > 0) {
          const action = request.conflictResolutions?.[modelId];
          if (!action) {
            throw new Error(
              `Model ${modelId} has an existing compatibility group conflict in this category. Explicit merge or cancel choice is required.`
            );
          }

          if (action === 'cancel') {
            // Skip including this model in the new group; leave in existing group
            continue;
          } else if (action === 'merge') {
            // Remove from old group
            await client.query(
              'DELETE FROM compatibility_group_members WHERE id = $1',
              [conflictRes.rows[0].id]
            );
          }
        }

        resolvedModelIds.push(modelId);
      }

      if (resolvedModelIds.length < 2) {
        // Cannot create singleton group
        continue;
      }

      // Create compatibility group
      const groupRes = await client.query(
        `INSERT INTO compatibility_groups (category_id, is_active, created_by_admin_id, updated_by_admin_id)
         VALUES ($1, true, $2, $2)
         RETURNING id`,
        [request.categoryId, adminUserId]
      );
      const groupId = groupRes.rows[0].id;
      createdGroupsCount++;

      // Insert member models
      for (const mId of resolvedModelIds) {
        await client.query(
          `INSERT INTO compatibility_group_members (group_id, model_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [groupId, mId]
        );
        createdMembersCount++;
      }
    }

    await client.query('COMMIT');

    // Invalidate affected Redis cache
    await invalidateCatalogCache();

    return {
      success: true,
      createdGroupsCount,
      createdMembersCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllCompatibilityGroupsAdmin(categoryId?: string) {
  const pool = getPool();
  const params: any[] = [];
  let whereClause = '';
  if (categoryId) {
    params.push(categoryId);
    whereClause = 'WHERE cg.category_id = $1';
  }

  const res = await pool.query(
    `SELECT
       cg.id,
       cg.category_id AS "categoryId",
       sc.name AS "categoryName",
       cg.is_active AS "isActive",
       cg.created_at AS "createdAt",
       cg.updated_at AS "updatedAt",
       COALESCE(
         json_agg(
           json_build_object(
             'modelId', mm.id,
             'modelName', mm.name,
             'modelNumber', mm.model_number,
             'brandId', b.id,
             'brandName', b.name
           ) ORDER BY b.name ASC, mm.name ASC
         ) FILTER (WHERE mm.id IS NOT NULL),
         '[]'::json
       ) AS members
     FROM compatibility_groups cg
     JOIN spare_part_categories sc ON sc.id = cg.category_id
     LEFT JOIN compatibility_group_members cgm ON cgm.group_id = cg.id
     LEFT JOIN mobile_models mm ON mm.id = cgm.model_id
     LEFT JOIN brands b ON b.id = mm.brand_id
     ${whereClause}
     GROUP BY cg.id, sc.name
     ORDER BY cg.updated_at DESC`,
    params
  );

  return res.rows;
}

export async function updateCompatibilityGroup(
  groupId: string,
  payload: { categoryId?: string; modelIds: string[]; isActive?: boolean },
  adminUserId: string
) {
  const uniqueModelIds = Array.from(new Set(payload.modelIds));
  if (uniqueModelIds.length < 2) {
    const err: any = new Error('A compatibility group must contain at least 2 models.');
    err.code = 'MIN_TWO_MODELS_REQUIRED';
    err.statusCode = 400;
    throw err;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingGroupRes = await client.query(
      'SELECT id, category_id, is_active FROM compatibility_groups WHERE id = $1 LIMIT 1',
      [groupId]
    );
    if (existingGroupRes.rowCount === 0) {
      const err: any = new Error('Compatibility group not found.');
      err.code = 'GROUP_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const targetCategoryId = payload.categoryId || existingGroupRes.rows[0].category_id;
    const targetIsActive =
      payload.isActive !== undefined ? payload.isActive : existingGroupRes.rows[0].is_active;

    await client.query(
      `UPDATE compatibility_groups
       SET category_id = $1, is_active = $2, updated_by_admin_id = $3, updated_at = NOW()
       WHERE id = $4`,
      [targetCategoryId, targetIsActive, adminUserId, groupId]
    );

    // Replace members cleanly, removing any old membership in the same category for these models
    await client.query('DELETE FROM compatibility_group_members WHERE group_id = $1', [groupId]);

    for (const modelId of uniqueModelIds) {
      await client.query(
        `DELETE FROM compatibility_group_members cgm
         USING compatibility_groups cg
         WHERE cgm.group_id = cg.id
           AND cg.category_id = $1
           AND cgm.model_id = $2
           AND cg.id <> $3`,
        [targetCategoryId, modelId, groupId]
      );

      await client.query(
        `INSERT INTO compatibility_group_members (group_id, model_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [groupId, modelId]
      );
    }

    await client.query('COMMIT');
    await invalidateCatalogCache();
    return { success: true, id: groupId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCompatibilityGroup(groupId: string) {
  const db = getDb();
  await db.delete(compatibilityGroups).where(eq(compatibilityGroups.id, groupId));
  await invalidateCatalogCache();
  return { success: true };
}

