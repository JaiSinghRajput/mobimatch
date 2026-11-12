import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  CreateIssueReportRequestSchema,
  CreateModelRequestSchema,
} from '@mobimatch/api-contracts';
import { getDb } from '../../db';
import { issueReports, modelRequests, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const reportRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Middleware to authenticate user
  const authenticate = async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to submit reports',
          requestId: req.id,
        },
      });
    }

    const db = getDb();
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (userList.length === 0 || userList[0].status !== 'active') {
      return reply.status(403).send({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'User account is not active',
          requestId: req.id,
        },
      });
    }
  };

  // POST /v1/reports (Compatibility issue report)
  server.post(
    '/v1/reports',
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    async (req, reply) => {
      const parseResult = CreateIssueReportRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_REPORT_DATA',
            message: parseResult.error.errors.map((e) => e.message).join(', '),
            requestId: req.id,
          },
        });
      }

      const db = getDb();
      const [report] = await db
        .insert(issueReports)
        .values({
          userId: req.user.userId,
          type: parseResult.data.type,
          categoryId: parseResult.data.categoryId || null,
          modelId: parseResult.data.modelId || null,
          groupId: parseResult.data.groupId || null,
          description: parseResult.data.description || null,
          status: 'open',
        })
        .returning();

      return reply.status(201).send({
        success: true,
        reportId: report.id,
        status: report.status,
      });
    }
  );

  // POST /v1/model-requests (Missing mobile model request)
  server.post(
    '/v1/model-requests',
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    async (req, reply) => {
      const parseResult = CreateModelRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_MODEL_REQUEST_DATA',
            message: parseResult.error.errors.map((e) => e.message).join(', '),
            requestId: req.id,
          },
        });
      }

      const db = getDb();
      const [created] = await db
        .insert(modelRequests)
        .values({
          userId: req.user.userId,
          brandNameSubmitted: parseResult.data.brandName.trim(),
          modelNameSubmitted: parseResult.data.modelName.trim(),
          modelNumberSubmitted: parseResult.data.modelNumber?.trim() || null,
          notes: parseResult.data.notes?.trim() || null,
          status: 'pending',
        })
        .returning();

      return reply.status(201).send({
        success: true,
        requestId: created.id,
        status: created.status,
      });
    }
  );
};

