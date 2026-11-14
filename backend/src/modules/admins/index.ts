import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { config } from '../../config';
import { getDb } from '../../db';
import {
  users,
  adminAllowlist,
  brands,
  mobileModels,
  sparePartCategories,
  issueReports,
  modelRequests,
} from '../../db/schema';
import {
  getAllBrandsAdmin,
  createBrand,
  updateBrand,
  setBrandActiveStatus,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  setCategoryActiveStatus,
  getAllModelsAdmin,
  createModel,
  updateModel,
  setModelActiveStatus,
  autoDeduplicateBrands,
  autoDeduplicateCategories,
} from '../catalog/service';
import {
  generateParsePreview,
  publishCompatibilityTransaction,
} from '../compatibility/service';
import {
  PublishCompatibilityRequestSchema,
  AddAdminAllowlistRequestSchema,
} from '@mobimatch/api-contracts';

export const adminRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Enforce Admin Allowlist Verification on EVERY admin request
  server.addHook('preHandler', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Admin authentication required',
          requestId: req.id,
        },
      });
    }

    const db = getDb();
    const normalizedEmail = req.user.email.toLowerCase().trim();

    // Live query against admin_allowlist table
    const allowlistEntry = await db
      .select({ id: adminAllowlist.id })
      .from(adminAllowlist)
      .where(eq(adminAllowlist.emailNormalized, normalizedEmail))
      .limit(1);

    if (allowlistEntry.length === 0) {
      return reply.status(403).send({
        error: {
          code: 'ADMIN_ACCESS_REVOKED',
          message: 'Administrator privileges have been revoked for this account',
          requestId: req.id,
        },
      });
    }
  });

  // ==========================================
  // Brand Management
  // ==========================================
  server.get('/v1/admin/brands', async (req, reply) => {
    const list = await getAllBrandsAdmin();
    return reply.status(200).send(list);
  });

  server.post<{ Body: { name: string } }>('/v1/admin/brands', async (req, reply) => {
    if (!req.body?.name?.trim()) {
      return reply.status(400).send({
        error: { code: 'INVALID_NAME', message: 'Brand name is required', requestId: req.id },
      });
    }
    try {
      const brand = await createBrand(req.body.name);
      return reply.status(201).send(brand);
    } catch (err: any) {
      if (err.statusCode === 409 || err.code === 'BRAND_ALREADY_EXISTS') {
        return reply.status(409).send({
          error: {
            code: 'BRAND_ALREADY_EXISTS',
            message: err.message,
            existingBrand: err.existingBrand,
            requestId: req.id,
          },
        });
      }
      throw err;
    }
  });

  server.patch<{ Params: { id: string }; Body: { name: string } }>(
    '/v1/admin/brands/:id',
    async (req, reply) => {
      if (!req.body?.name?.trim()) {
        return reply.status(400).send({
          error: { code: 'INVALID_NAME', message: 'Brand name is required', requestId: req.id },
        });
      }
      try {
        const updated = await updateBrand(req.params.id, req.body.name);
        return reply.status(200).send(updated);
      } catch (err: any) {
        if (err.statusCode === 409 || err.code === 'BRAND_ALREADY_EXISTS') {
          return reply.status(409).send({
            error: {
              code: 'BRAND_ALREADY_EXISTS',
              message: err.message,
              requestId: req.id,
            },
          });
        }
        throw err;
      }
    }
  );

  server.post<{ Params: { id: string } }>(
    '/v1/admin/brands/:id/deactivate',
    async (req, reply) => {
      const updated = await setBrandActiveStatus(req.params.id, false);
      return reply.status(200).send(updated);
    }
  );

  server.post<{ Params: { id: string } }>(
    '/v1/admin/brands/:id/reactivate',
    async (req, reply) => {
      const updated = await setBrandActiveStatus(req.params.id, true);
      return reply.status(200).send(updated);
    }
  );

  // Auto-deduplicate duplicate brands and merge their models
  server.post('/v1/admin/brands/deduplicate', async (req, reply) => {
    const result = await autoDeduplicateBrands();
    return reply.status(200).send(result);
  });

  // ==========================================
  // Category Management
  // ==========================================
  server.get('/v1/admin/categories', async (req, reply) => {
    const list = await getAllCategoriesAdmin();
    return reply.status(200).send(list);
  });

  server.post<{ Body: { name: string } }>('/v1/admin/categories', async (req, reply) => {
    if (!req.body?.name?.trim()) {
      return reply.status(400).send({
        error: { code: 'INVALID_NAME', message: 'Category name is required', requestId: req.id },
      });
    }
    try {
      const category = await createCategory(req.body.name);
      return reply.status(201).send(category);
    } catch (err: any) {
      if (err.statusCode === 409 || err.code === 'CATEGORY_ALREADY_EXISTS') {
        return reply.status(409).send({
          error: {
            code: 'CATEGORY_ALREADY_EXISTS',
            message: err.message,
            existingCategory: err.existingCategory,
            requestId: req.id,
          },
        });
      }
      throw err;
    }
  });

  server.patch<{ Params: { id: string }; Body: { name: string } }>(
    '/v1/admin/categories/:id',
    async (req, reply) => {
      if (!req.body?.name?.trim()) {
        return reply.status(400).send({
          error: { code: 'INVALID_NAME', message: 'Category name is required', requestId: req.id },
        });
      }
      try {
        const updated = await updateCategory(req.params.id, req.body.name);
        return reply.status(200).send(updated);
      } catch (err: any) {
        if (err.statusCode === 409 || err.code === 'CATEGORY_ALREADY_EXISTS') {
          return reply.status(409).send({
            error: {
              code: 'CATEGORY_ALREADY_EXISTS',
              message: err.message,
              requestId: req.id,
            },
          });
        }
        throw err;
      }
    }
  );

  server.post<{ Params: { id: string } }>(
    '/v1/admin/categories/:id/deactivate',
    async (req, reply) => {
      const updated = await setCategoryActiveStatus(req.params.id, false);
      return reply.status(200).send(updated);
    }
  );

  server.post<{ Params: { id: string } }>(
    '/v1/admin/categories/:id/reactivate',
    async (req, reply) => {
      const updated = await setCategoryActiveStatus(req.params.id, true);
      return reply.status(200).send(updated);
    }
  );

  // Auto-deduplicate duplicate categories
  server.post('/v1/admin/categories/deduplicate', async (req, reply) => {
    const result = await autoDeduplicateCategories();
    return reply.status(200).send(result);
  });

  // ==========================================
  // Model Management
  // ==========================================
  server.get('/v1/admin/models', async (req, reply) => {
    const list = await getAllModelsAdmin();
    return reply.status(200).send(list);
  });

  server.post<{
    Body: { brandId: string; name: string; modelNumber?: string | null };
  }>('/v1/admin/models', async (req, reply) => {
    const { brandId, name, modelNumber } = req.body || {};
    if (!brandId || !name?.trim()) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_MODEL_DATA',
          message: 'Both brandId and model name are required',
          requestId: req.id,
        },
      });
    }
    try {
      const model = await createModel(brandId, name, modelNumber);
      return reply.status(201).send(model);
    } catch (err: any) {
      if (err.statusCode === 409 || err.code === 'MODEL_ALREADY_EXISTS') {
        return reply.status(409).send({
          error: {
            code: 'MODEL_ALREADY_EXISTS',
            message: err.message,
            existingModel: err.existingModel,
            requestId: req.id,
          },
        });
      }
      throw err;
    }
  });

  server.patch<{
    Params: { id: string };
    Body: { brandId?: string; name?: string; modelNumber?: string | null };
  }>('/v1/admin/models/:id', async (req, reply) => {
    try {
      const updated = await updateModel(req.params.id, req.body);
      return reply.status(200).send(updated);
    } catch (err: any) {
      if (err.statusCode === 409 || err.code === 'MODEL_ALREADY_EXISTS') {
        return reply.status(409).send({
          error: {
            code: 'MODEL_ALREADY_EXISTS',
            message: err.message,
            requestId: req.id,
          },
        });
      }
      throw err;
    }
  });

  server.post<{ Params: { id: string } }>(
    '/v1/admin/models/:id/deactivate',
    async (req, reply) => {
      const updated = await setModelActiveStatus(req.params.id, false);
      return reply.status(200).send(updated);
    }
  );

  server.post<{ Params: { id: string } }>(
    '/v1/admin/models/:id/reactivate',
    async (req, reply) => {
      const updated = await setModelActiveStatus(req.params.id, true);
      return reply.status(200).send(updated);
    }
  );

  // ==========================================
  // Bulk Compatibility Engine
  // ==========================================
  server.post<{ Body: { categoryId: string; text: string } }>(
    '/v1/admin/compatibility/parse-preview',
    async (req, reply) => {
      const { categoryId, text } = req.body || {};
      if (!categoryId || !text) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_INPUT',
            message: 'Both categoryId and text input are required',
            requestId: req.id,
          },
        });
      }

      try {
        const preview = await generateParsePreview(categoryId, text);
        return reply.status(200).send(preview);
      } catch (err) {
        return reply.status(400).send({
          error: {
            code: 'PREVIEW_ERROR',
            message: (err as Error).message,
            requestId: req.id,
          },
        });
      }
    }
  );

  server.post('/v1/admin/compatibility/publish', async (req, reply) => {
    const parseResult = PublishCompatibilityRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_PUBLISH_REQUEST',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
          requestId: req.id,
        },
      });
    }

    try {
      const result = await publishCompatibilityTransaction(
        req.user.userId,
        parseResult.data
      );
      return reply.status(200).send(result);
    } catch (err) {
      return reply.status(400).send({
        error: {
          code: 'PUBLISH_FAILED',
          message: (err as Error).message || 'Failed to publish compatibility group',
          requestId: req.id,
        },
      });
    }
  });

  // ==========================================
  // User Management
  // ==========================================
  server.get('/v1/admin/users', async (req, reply) => {
    const db = getDb();
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        shopName: users.shopName,
        city: users.city,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(100);

    return reply.status(200).send(userList);
  });

  server.get<{ Params: { id: string } }>('/v1/admin/users/:id', async (req, reply) => {
    const db = getDb();
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, req.params.id))
      .limit(1);

    if (userList.length === 0) {
      return reply.status(404).send({
        error: { code: 'USER_NOT_FOUND', message: 'User not found', requestId: req.id },
      });
    }

    return reply.status(200).send(userList[0]);
  });

  server.post<{ Params: { id: string } }>(
    '/v1/admin/users/:id/deactivate',
    async (req, reply) => {
      const db = getDb();
      const [updated] = await db
        .update(users)
        .set({ status: 'deactivated', updatedAt: new Date() })
        .where(eq(users.id, req.params.id))
        .returning();

      return reply.status(200).send(updated);
    }
  );

  server.post<{ Params: { id: string } }>(
    '/v1/admin/users/:id/reactivate',
    async (req, reply) => {
      const db = getDb();
      const [updated] = await db
        .update(users)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(users.id, req.params.id))
        .returning();

      return reply.status(200).send(updated);
    }
  );

  // ==========================================
  // Issue Reports Management
  // ==========================================
  server.get('/v1/admin/reports', async (req, reply) => {
    const db = getDb();
    const reports = await db
      .select({
        id: issueReports.id,
        userId: issueReports.userId,
        type: issueReports.type,
        categoryId: issueReports.categoryId,
        modelId: issueReports.modelId,
        groupId: issueReports.groupId,
        description: issueReports.description,
        status: issueReports.status,
        createdAt: issueReports.createdAt,
      })
      .from(issueReports)
      .orderBy(desc(issueReports.createdAt))
      .limit(100);

    return reply.status(200).send(reports);
  });

  server.patch<{ Params: { id: string }; Body: { status: string } }>(
    '/v1/admin/reports/:id/status',
    async (req, reply) => {
      const { status } = req.body || {};
      const validStatuses = ['open', 'reviewing', 'resolved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_STATUS',
            message: `Status must be one of: ${validStatuses.join(', ')}`,
            requestId: req.id,
          },
        });
      }

      const db = getDb();
      const [updated] = await db
        .update(issueReports)
        .set({ status, updatedAt: new Date() })
        .where(eq(issueReports.id, req.params.id))
        .returning();

      return reply.status(200).send(updated);
    }
  );

  // ==========================================
  // Model Requests Management
  // ==========================================
  server.get('/v1/admin/model-requests', async (req, reply) => {
    const db = getDb();
    const requests = await db
      .select()
      .from(modelRequests)
      .orderBy(desc(modelRequests.createdAt))
      .limit(100);

    return reply.status(200).send(requests);
  });

  server.patch<{ Params: { id: string }; Body: { status: string } }>(
    '/v1/admin/model-requests/:id/status',
    async (req, reply) => {
      const { status } = req.body || {};
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_STATUS',
            message: `Status must be one of: ${validStatuses.join(', ')}`,
            requestId: req.id,
          },
        });
      }

      const db = getDb();
      const [updated] = await db
        .update(modelRequests)
        .set({
          status,
          reviewedByAdminId: req.user.userId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(modelRequests.id, req.params.id))
        .returning();

      return reply.status(200).send(updated);
    }
  );

  // ==========================================
  // Admin Allowlist Management
  // ==========================================
  server.get('/v1/admin/admins', async (req, reply) => {
    const db = getDb();
    const list = await db
      .select({
        id: adminAllowlist.id,
        emailNormalized: adminAllowlist.emailNormalized,
        addedByAdminId: adminAllowlist.addedByAdminId,
        createdAt: adminAllowlist.createdAt,
      })
      .from(adminAllowlist)
      .orderBy(adminAllowlist.emailNormalized);

    return reply.status(200).send(list);
  });

  server.post('/v1/admin/admins', async (req, reply) => {
    const parseResult = AddAdminAllowlistRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Valid email address is required',
          requestId: req.id,
        },
      });
    }

    const normalized = parseResult.data.email.toLowerCase().trim();
    const db = getDb();

    // Check duplicate
    const existing = await db
      .select({ id: adminAllowlist.id })
      .from(adminAllowlist)
      .where(eq(adminAllowlist.emailNormalized, normalized))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(400).send({
        error: {
          code: 'DUPLICATE_ADMIN',
          message: 'Email is already in the administrator allowlist',
          requestId: req.id,
        },
      });
    }

    const [created] = await db
      .insert(adminAllowlist)
      .values({
        emailNormalized: normalized,
        addedByAdminId: req.user.userId,
      })
      .returning();

    return reply.status(201).send(created);
  });

  server.delete<{ Params: { id: string } }>('/v1/admin/admins/:id', async (req, reply) => {
    const db = getDb();

    // 1. Find the target entry to be removed
    const targetAdmin = await db
      .select({ id: adminAllowlist.id, emailNormalized: adminAllowlist.emailNormalized })
      .from(adminAllowlist)
      .where(eq(adminAllowlist.id, req.params.id))
      .limit(1);

    if (targetAdmin.length === 0) {
      return reply.status(404).send({
        error: {
          code: 'ADMIN_NOT_FOUND',
          message: 'Admin allowlist entry not found',
          requestId: req.id,
        },
      });
    }

    const targetEmail = targetAdmin[0].emailNormalized;
    const currentAdminEmail = req.user.email.trim().toLowerCase();
    const envAdminEmail = (config.initialAdminEmail || '').trim().toLowerCase();

    // 2. Prevent removing the final administrator
    const countRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminAllowlist);

    const totalAdmins = Number(countRes[0]?.count || 0);
    if (totalAdmins <= 1) {
      return reply.status(400).send({
        error: {
          code: 'CANNOT_REMOVE_LAST_ADMIN',
          message: 'Cannot remove the last administrator from the allowlist',
          requestId: req.id,
        },
      });
    }

    // 3. Prevent removing yourself
    if (targetEmail === currentAdminEmail) {
      return reply.status(400).send({
        error: {
          code: 'CANNOT_REMOVE_SELF',
          message: 'You cannot remove your own administrator account from the allowlist',
          requestId: req.id,
        },
      });
    }

    // 4. Prevent removing the environment / primary administrator
    if (envAdminEmail && targetEmail === envAdminEmail) {
      return reply.status(400).send({
        error: {
          code: 'CANNOT_REMOVE_ENV_ADMIN',
          message: `Cannot remove the primary environment administrator (${envAdminEmail}) from the allowlist`,
          requestId: req.id,
        },
      });
    }

    await db.delete(adminAllowlist).where(eq(adminAllowlist.id, req.params.id));

    return reply.status(200).send({
      success: true,
      message: 'Admin removed from allowlist successfully',
    });
  });
};

