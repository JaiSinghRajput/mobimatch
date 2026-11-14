import { FastifyPluginAsync } from 'fastify';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb } from '../../db';
import { adSettings, customBanners } from '../../db/schema';
import { getCache, setCache } from '../../cache';

export const adsRoutes: FastifyPluginAsync = async (server) => {
  // ==========================================
  // Public Ad Endpoints (for User App)
  // ==========================================

  server.get('/v1/ads/config', async (req, reply) => {
    const cacheKey = 'mobimatch:ads:config';
    const cached = await getCache<any>(cacheKey);
    if (cached) return reply.status(200).send(cached);

    const db = getDb();
    let settings = await db.select().from(adSettings).limit(1);

    if (settings.length === 0) {
      // Return default configuration
      const fallback = {
        adsEnabled: true,
        adProvider: 'admob',
        admobAppId: 'ca-app-pub-3940256099942544~3347511713',
        admobBannerId: 'ca-app-pub-3940256099942544/6300978111',
        admobInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
        admobRewardedId: 'ca-app-pub-3940256099942544/5224354917',
        showOnHome: true,
        showOnResults: true,
        showOnCatalog: true,
        bannerRefreshIntervalSec: 30,
        customBanners: [],
      };
      return reply.status(200).send(fallback);
    }

    const currentSettings = settings[0];
    const activeBanners = await db
      .select()
      .from(customBanners)
      .where(eq(customBanners.isActive, true))
      .orderBy(desc(customBanners.createdAt));

    const responsePayload = {
      ...currentSettings,
      customBanners: activeBanners,
    };

    await setCache(cacheKey, responsePayload, 60); // 1 minute cache
    return reply.status(200).send(responsePayload);
  });

  server.post<{ Params: { id: string } }>('/v1/ads/banners/:id/click', async (req, reply) => {
    const db = getDb();
    await db
      .update(customBanners)
      .set({
        clickCount: sql`${customBanners.clickCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(customBanners.id, req.params.id));

    return reply.status(200).send({ success: true });
  });

  // ==========================================
  // Protected Admin Advertisement Management
  // ==========================================

  server.register(async (adminScope) => {
    adminScope.addHook('preHandler', async (req) => {
      await req.jwtVerify();
    });

    // Get Ad Settings
    adminScope.get('/v1/admin/ads/settings', async (req, reply) => {
      const db = getDb();
      let settings = await db.select().from(adSettings).limit(1);

      if (settings.length === 0) {
        const [created] = await db
          .insert(adSettings)
          .values({
            adsEnabled: true,
            adProvider: 'admob',
            admobAppId: 'ca-app-pub-3940256099942544~3347511713',
            admobBannerId: 'ca-app-pub-3940256099942544/6300978111',
            admobInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
            admobRewardedId: 'ca-app-pub-3940256099942544/5224354917',
            showOnHome: true,
            showOnResults: true,
            showOnCatalog: true,
            bannerRefreshIntervalSec: 30,
          })
          .returning();
        return reply.status(200).send(created);
      }

      return reply.status(200).send(settings[0]);
    });

    // Update Ad Settings
    adminScope.put<{
      Body: {
        adsEnabled?: boolean;
        adProvider?: string;
        admobAppId?: string;
        admobBannerId?: string;
        admobInterstitialId?: string;
        admobRewardedId?: string;
        showOnHome?: boolean;
        showOnResults?: boolean;
        showOnCatalog?: boolean;
        bannerRefreshIntervalSec?: number;
      };
    }>('/v1/admin/ads/settings', async (req, reply) => {
      const db = getDb();
      const current = await db.select().from(adSettings).limit(1);
      const updateData: Record<string, any> = {
        ...req.body,
        updatedAt: new Date(),
      };

      let updated;
      if (current.length === 0) {
        [updated] = await db.insert(adSettings).values(updateData).returning();
      } else {
        [updated] = await db
          .update(adSettings)
          .set(updateData)
          .where(eq(adSettings.id, current[0].id))
          .returning();
      }

      return reply.status(200).send(updated);
    });

    // List Custom House Banners
    adminScope.get('/v1/admin/ads/banners', async (req, reply) => {
      const db = getDb();
      const banners = await db
        .select()
        .from(customBanners)
        .orderBy(desc(customBanners.createdAt));
      return reply.status(200).send(banners);
    });

    // Create Custom House Banner
    adminScope.post<{
      Body: {
        title: string;
        description: string;
        imageUrl?: string | null;
        targetUrl: string;
        placement?: string;
        isActive?: boolean;
      };
    }>('/v1/admin/ads/banners', async (req, reply) => {
      const { title, description, imageUrl, targetUrl, placement, isActive } = req.body || {};
      if (!title?.trim() || !description?.trim() || !targetUrl?.trim()) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_BANNER_DATA',
            message: 'Title, description, and target URL are required for promotion banners',
            requestId: req.id,
          },
        });
      }

      const db = getDb();
      const [banner] = await db
        .insert(customBanners)
        .values({
          title: title.trim(),
          description: description.trim(),
          imageUrl: imageUrl ? imageUrl.trim() : null,
          targetUrl: targetUrl.trim(),
          placement: placement || 'all',
          isActive: isActive !== undefined ? isActive : true,
        })
        .returning();

      return reply.status(201).send(banner);
    });

    // Update Banner
    adminScope.patch<{
      Params: { id: string };
      Body: {
        title?: string;
        description?: string;
        imageUrl?: string | null;
        targetUrl?: string;
        placement?: string;
        isActive?: boolean;
      };
    }>('/v1/admin/ads/banners/:id', async (req, reply) => {
      const db = getDb();
      const [updated] = await db
        .update(customBanners)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(customBanners.id, req.params.id))
        .returning();

      return reply.status(200).send(updated);
    });

    // Delete Banner
    adminScope.delete<{ Params: { id: string } }>('/v1/admin/ads/banners/:id', async (req, reply) => {
      const db = getDb();
      await db.delete(customBanners).where(eq(customBanners.id, req.params.id));
      return reply.status(200).send({ success: true });
    });
  });
};
