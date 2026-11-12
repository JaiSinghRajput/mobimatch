import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { eq, and } from 'drizzle-orm';
import {
  getActiveBrands,
  getActiveCategories,
  getActiveModelsByBrand,
  searchActiveModels,
} from './service';
import { getDb } from '../../db';
import { mobileModels, brands } from '../../db/schema';

export const catalogRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /v1/brands (Active brands, alphabetical A-Z)
  server.get('/v1/brands', async (req, reply) => {
    const list = await getActiveBrands();
    return reply.status(200).send(list);
  });

  // GET /v1/brands/:brandId/models (Active models for brand, alphabetical A-Z)
  server.get<{ Params: { brandId: string } }>(
    '/v1/brands/:brandId/models',
    async (req, reply) => {
      const { brandId } = req.params;
      const list = await getActiveModelsByBrand(brandId);
      return reply.status(200).send(list);
    }
  );

  // GET /v1/categories (Active categories, alphabetical A-Z)
  server.get('/v1/categories', async (req, reply) => {
    const list = await getActiveCategories();
    return reply.status(200).send(list);
  });

  // GET /v1/models/search?q=... (Suggestions & search by brand, model, model number)
  server.get<{ Querystring: { q?: string; limit?: string } }>(
    '/v1/models/search',
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute',
        },
      },
    },
    async (req, reply) => {
      const q = req.query.q || '';
      const limit = parseInt(req.query.limit || '20', 10);

      if (q.trim().length === 0) {
        return reply.status(200).send([]);
      }

      const results = await searchActiveModels(q, Math.min(limit, 50));
      return reply.status(200).send(results);
    }
  );

  // GET /v1/models/:modelId
  server.get<{ Params: { modelId: string } }>(
    '/v1/models/:modelId',
    async (req, reply) => {
      const { modelId } = req.params;
      const db = getDb();

      const res = await db
        .select({
          id: mobileModels.id,
          brandId: mobileModels.brandId,
          brandName: brands.name,
          name: mobileModels.name,
          modelNumber: mobileModels.modelNumber,
          isActive: mobileModels.isActive,
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

      if (res.length === 0) {
        return reply.status(404).send({
          error: {
            code: 'MODEL_NOT_FOUND',
            message: 'Model not found or inactive',
            requestId: req.id,
          },
        });
      }

      return reply.status(200).send(res[0]);
    }
  );
};

