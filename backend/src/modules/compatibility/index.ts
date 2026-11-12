import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getCompatibilityResult } from './service';

export const compatibilityRoutes: FastifyPluginAsync = async (
  server: FastifyInstance
) => {
  // GET /v1/compatibility?modelId=...&categoryId=...
  server.get<{ Querystring: { modelId?: string; categoryId?: string } }>(
    '/v1/compatibility',
    async (req, reply) => {
      const { modelId, categoryId } = req.query;

      if (!modelId || !categoryId) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_QUERY',
            message: 'Both modelId and categoryId are required query parameters',
            requestId: req.id,
          },
        });
      }

      const result = await getCompatibilityResult(modelId, categoryId);

      if (!result) {
        return reply.status(404).send({
          error: {
            code: 'NO_COMPATIBILITY_FOUND',
            message: 'No compatibility information found.',
            requestId: req.id,
          },
        });
      }

      return reply.status(200).send(result);
    }
  );
};

