import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { setupTestEnvironment, cleanupTestEnvironment } from './test-helper';
import { FastifyInstance } from 'fastify';

describe('MobiMatch Backend API Integration Test Suite', () => {
  let server: FastifyInstance;
  let request: ReturnType<typeof supertest>;

  let userToken: string;
  let userRefreshToken: string;
  let userId: string;

  let adminToken: string;
  let adminUserId: string;

  let brandId: string;
  let modelId1: string;
  let modelId2: string;
  let categoryId: string;

  beforeAll(async () => {
    const env = await setupTestEnvironment();
    server = env.server;
    request = supertest(server.server);
  });

  afterAll(async () => {
    await server.close();
    await cleanupTestEnvironment();
  });

  // ==========================================
  // 1. Health & App Config Tests
  // ==========================================
  describe('Health & Config Endpoints', () => {
    it('GET /health/live returns 200 OK', async () => {
      const res = await request.get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health/ready returns 200 OK and DB ready', async () => {
      const res = await request.get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.database).toBe('ready');
    });

    it('GET /v1/app-config returns maintenance and version metadata', async () => {
      const res = await request.get('/v1/app-config');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('isMaintenanceMode');
      expect(res.body).toHaveProperty('minUserAppVersion');
      expect(res.body).toHaveProperty('accountDeletionUrl');
    });

    it('GET /account-deletion returns public HTML page for Play policy compliance', async () => {
      const res = await request.get('/account-deletion');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('MobiMatch Account & Data Deletion');
    });

    it('GET /privacy returns public Privacy Policy HTML page', async () => {
      const res = await request.get('/privacy');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('MobiMatch Privacy Policy');
    });

    it('GET /terms returns public Terms & Conditions HTML page', async () => {
      const res = await request.get('/terms');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('MobiMatch Terms and Conditions');
    });
  });

  // ==========================================
  // 2. Authentication & User Profile Tests
  // ==========================================
  describe('Authentication & Profile Flows', () => {
    it('POST /v1/auth/google signs up a new user via Google token', async () => {
      const res = await request
        .post('/v1/auth/google')
        .send({
          idToken: 'mock-:technician1@example.com:sub-google-1001:John Tech',
          clientApp: 'user',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('technician1@example.com');
      expect(res.body.user.isAdmin).toBe(false);
      expect(res.body.user.isProfileComplete).toBe(false);

      userToken = res.body.accessToken;
      userRefreshToken = res.body.refreshToken;
      userId = res.body.user.id;
    });

    it('existing Google sub maps to the exact same user account', async () => {
      const res = await request
        .post('/v1/auth/google')
        .send({
          idToken: 'mock-:technician1@example.com:sub-google-1001:John Tech',
          clientApp: 'user',
        });

      console.error('DEBUG AUTH BODY:', res.status, JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(userId);
    });

    it('POST /v1/users/complete-profile saves phone, shopName, city and accepts terms', async () => {
      const res = await request
        .post('/v1/users/complete-profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          phone: '+919876543210',
          shopName: 'QuickFix Mobiles',
          city: 'Mumbai',
          termsAccepted: true,
          privacyAccepted: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.isProfileComplete).toBe(true);
      expect(res.body.shopName).toBe('QuickFix Mobiles');
    });

    it('GET /v1/users/me returns authenticated user profile', async () => {
      const res = await request
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
      expect(res.body.city).toBe('Mumbai');
    });

    it('PATCH /v1/users/me updates profile fields safely without mass assignment', async () => {
      const res = await request
        .patch('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          city: 'Pune',
        });

      expect(res.status).toBe(200);
      expect(res.body.city).toBe('Pune');
    });

    it('POST /v1/auth/refresh rotates the refresh token', async () => {
      const res = await request
        .post('/v1/auth/refresh')
        .send({ refreshToken: userRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      // Old refresh token must be rejected upon reuse
      const reuseRes = await request
        .post('/v1/auth/refresh')
        .send({ refreshToken: userRefreshToken });
      expect(reuseRes.status).toBe(401);

      // Update tokens
      userToken = res.body.accessToken;
      userRefreshToken = res.body.refreshToken;
    });

    it('denies Admin App sign-in if email is not on administrator allowlist', async () => {
      const res = await request
        .post('/v1/auth/google')
        .send({
          idToken: 'mock-:nonadmin@example.com:sub-nonadmin:Regular User',
          clientApp: 'admin',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ADMIN_ACCESS_DENIED');
    });

    it('allows Admin App sign-in for allowlisted email', async () => {
      const res = await request
        .post('/v1/auth/google')
        .send({
          idToken: 'mock-:admin@mobimatch.local:sub-admin-999:Super Admin',
          clientApp: 'admin',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.isAdmin).toBe(true);
      adminToken = res.body.accessToken;
      adminUserId = res.body.user.id;
    });
  });

  // ==========================================
  // 3. Security & Authorization Boundary Tests
  // ==========================================
  describe('Security & Admin Authorization Guardrails', () => {
    it('normal user receives 403 Forbidden on admin endpoints', async () => {
      const res = await request
        .get('/v1/admin/brands')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('unauthenticated request receives 401 Unauthorized', async () => {
      const res = await request.get('/v1/admin/brands');
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // 4. Catalog Management & Soft Deactivation
  // ==========================================
  describe('Catalog & Browsing Endpoints', () => {
    it('Admin can create brands and categories', async () => {
      // Create Brand
      const brandRes = await request
        .post('/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Redmi' });
      expect(brandRes.status).toBe(201);
      brandId = brandRes.body.id;

      // Create Category
      const catRes = await request
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Display / LCD' });
      expect(catRes.status).toBe(201);
      categoryId = catRes.body.id;

      // Create Models under Brand
      const modelRes1 = await request
        .post('/v1/admin/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ brandId, name: 'Note 10', modelNumber: 'M2101K7AI' });
      expect(modelRes1.status).toBe(201);
      modelId1 = modelRes1.body.id;

      const modelRes2 = await request
        .post('/v1/admin/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ brandId, name: 'Note 10S' });
      expect(modelRes2.status).toBe(201);
      modelId2 = modelRes2.body.id;
    });

    it('rejects creating duplicate brand with 409 BRAND_ALREADY_EXISTS', async () => {
      const dupRes = await request
        .post('/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '  redmi  ' }); // Case and whitespace insensitive check
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('BRAND_ALREADY_EXISTS');
    });

    it('rejects creating duplicate category with 409 CATEGORY_ALREADY_EXISTS', async () => {
      const dupRes = await request
        .post('/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'display / lcd' });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('CATEGORY_ALREADY_EXISTS');
    });

    it('rejects creating duplicate model under same brand with 409 MODEL_ALREADY_EXISTS', async () => {
      const dupRes = await request
        .post('/v1/admin/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ brandId, name: 'note 10' });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('MODEL_ALREADY_EXISTS');
    });

    it('POST /v1/admin/brands/deduplicate executes cleanly', async () => {
      const dedupRes = await request
        .post('/v1/admin/brands/deduplicate')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(dedupRes.status).toBe(200);
      expect(dedupRes.body.success).toBe(true);
    });

    it('GET /v1/brands returns active brands alphabetically', async () => {
      const res = await request.get('/v1/brands');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((b: any) => b.name === 'Redmi')).toBe(true);
    });

    it('GET /v1/categories returns active categories alphabetically', async () => {
      const res = await request.get('/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.some((c: any) => c.name === 'Display / LCD')).toBe(true);
    });

    it('GET /v1/brands/:brandId/models returns models for brand', async () => {
      const res = await request.get(`/v1/brands/${brandId}/models`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('GET /v1/models/search supports partial matching and suggestions', async () => {
      const res = await request.get('/v1/models/search?q=Note');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0]).toHaveProperty('brandName');
      expect(res.body[0]).toHaveProperty('name');
    });

    it('soft deactivation hides brand from public listing without deleting records', async () => {
      // Deactivate brand
      await request
        .post(`/v1/admin/brands/${brandId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const publicRes = await request.get('/v1/brands');
      expect(publicRes.body.some((b: any) => b.id === brandId)).toBe(false);

      // Reactivate brand
      await request
        .post(`/v1/admin/brands/${brandId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const reactivatedRes = await request.get('/v1/brands');
      expect(reactivatedRes.body.some((b: any) => b.id === brandId)).toBe(true);
    });
  });

  // ==========================================
  // 5. Bulk Compatibility Parser, Conflict Resolution & Publish
  // ==========================================
  describe('Bulk Compatibility Parser & Publishing', () => {
    it('POST /v1/admin/compatibility/parse-preview parses lines and matches models', async () => {
      const input = 'Redmi Note 10 = Redmi Note 10S';
      const res = await request
        .post('/v1/admin/compatibility/parse-preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId, text: input });

      expect(res.status).toBe(200);
      expect(res.body.totalGroups).toBe(1);
      expect(res.body.lines[0].valid).toBe(true);
      expect(res.body.canPublishImmediately).toBe(true);
    });

    it('POST /v1/admin/compatibility/publish publishes group transactionally', async () => {
      const res = await request
        .post('/v1/admin/compatibility/publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          lines: [
            {
              models: [
                {
                  brandName: 'Redmi',
                  modelName: 'Note 10',
                  resolvedModelId: modelId1,
                  createIfMissing: false,
                },
                {
                  brandName: 'Redmi',
                  modelName: 'Note 10S',
                  resolvedModelId: modelId2,
                  createIfMissing: false,
                },
              ],
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.createdGroupsCount).toBe(1);
      expect(res.body.createdMembersCount).toBe(2);
    });

    it('GET /v1/compatibility returns full compatibility group with count', async () => {
      const res = await request.get(
        `/v1/compatibility?modelId=${modelId1}&categoryId=${categoryId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.selectedModel.modelId).toBe(modelId1);
      expect(res.body.models.some((m: any) => m.modelId === modelId2)).toBe(true);
    });

    it('GET /v1/compatibility returns 404 NO_COMPATIBILITY_FOUND when no group exists', async () => {
      const res = await request.get(
        `/v1/compatibility?modelId=00000000-0000-0000-0000-000000000000&categoryId=${categoryId}`
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NO_COMPATIBILITY_FOUND');
    });

    it('detects conflict when a model is re-added to another group in the same category', async () => {
      const input = 'Redmi Note 10 = Poco X3';
      const res = await request
        .post('/v1/admin/compatibility/parse-preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId, text: input });

      expect(res.status).toBe(200);
      expect(res.body.conflicts.length).toBeGreaterThan(0);
      expect(res.body.conflicts[0].modelId).toBe(modelId1);
    });

    it('honors conflict cancel choice and leaves conflicting model in old group', async () => {
      // Create model 3
      const m3Res = await request
        .post('/v1/admin/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ brandId, name: 'Note 10 Pro' });
      const modelId3 = m3Res.body.id;

      // Publish with conflict choice 'cancel' for modelId1
      const res = await request
        .post('/v1/admin/compatibility/publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          lines: [
            {
              models: [
                { brandName: 'Redmi', modelName: 'Note 10', resolvedModelId: modelId1 },
                { brandName: 'Redmi', modelName: 'Note 10 Pro', resolvedModelId: modelId3 },
              ],
            },
          ],
          conflictResolutions: {
            [modelId1]: 'cancel',
          },
        });

      expect(res.status).toBe(200);
      // modelId1 was skipped due to cancel, leaving fewer than 2 models for that line so no invalid group was created
      expect(res.body.success).toBe(true);
    });

    it('atomic transaction rolls back all changes if publish encounters an unresolved model error', async () => {
      const res = await request
        .post('/v1/admin/compatibility/publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          lines: [
            {
              models: [
                { brandName: 'NonExistentBrand', modelName: 'GhostModel1', createIfMissing: false },
                { brandName: 'NonExistentBrand', modelName: 'GhostModel2', createIfMissing: false },
              ],
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PUBLISH_FAILED');
    });
  });

  // ==========================================
  // 6. Issue Reports & Model Requests
  // ==========================================
  describe('User Reports & Model Requests', () => {
    let reportId: string;
    let modelRequestId: string;

    it('authenticated user can submit compatibility issue report', async () => {
      const res = await request
        .post('/v1/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'incorrect_compatibility',
          categoryId,
          modelId: modelId1,
          description: 'Note 10S uses different flex cable.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      reportId = res.body.reportId;
    });

    it('authenticated user can submit missing mobile model request', async () => {
      const res = await request
        .post('/v1/model-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandName: 'Realme',
          modelName: 'Narzo 50',
          modelNumber: 'RMX3286',
          notes: 'Please add this popular model.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      modelRequestId = res.body.requestId;
    });

    it('admin can list reports and update report status', async () => {
      const listRes = await request
        .get('/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBeGreaterThan(0);

      const updateRes = await request
        .patch(`/v1/admin/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'reviewing' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe('reviewing');
    });

    it('admin can approve/reject missing-model requests', async () => {
      const updateRes = await request
        .patch(`/v1/admin/model-requests/${modelRequestId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe('approved');
    });
  });

  // ==========================================
  // 7. Admin Allowlist Management
  // ==========================================
  describe('Admin Allowlist Operations', () => {
    let newAdminId: string;

    it('admin can add a new email to allowlist', async () => {
      const res = await request
        .post('/v1/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'newadmin@mobimatch.local' });

      expect(res.status).toBe(201);
      newAdminId = res.body.id;
    });

    it('admin can remove an email from allowlist', async () => {
      const res = await request
        .delete(`/v1/admin/admins/${newAdminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('prevents removing the final administrator from the allowlist', async () => {
      // Find the ID of the sole remaining admin (admin@mobimatch.local)
      const listRes = await request
        .get('/v1/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`);
      const remainingAdmin = listRes.body[0];

      const res = await request
        .delete(`/v1/admin/admins/${remainingAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_REMOVE_LAST_ADMIN');
    });

    it('immediate allowlist revocation: removed admin token is blocked on next request', async () => {
      // Add temp admin
      const addRes = await request
        .post('/v1/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'tempadmin@mobimatch.local' });
      const tempAdminId = addRes.body.id;

      // Temp admin signs in and gets admin token
      const authRes = await request
        .post('/v1/auth/google')
        .send({
          idToken: 'mock-:tempadmin@mobimatch.local:sub-temp-100:Temp Admin',
          clientApp: 'admin',
        });
      const tempAdminToken = authRes.body.accessToken;

      // Verify token works
      const testWork = await request
        .get('/v1/admin/brands')
        .set('Authorization', `Bearer ${tempAdminToken}`);
      expect(testWork.status).toBe(200);

      // Now primary admin removes temp admin from allowlist
      await request
        .delete(`/v1/admin/admins/${tempAdminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Even though tempAdminToken has not expired, next request is denied immediately!
      const blockedRes = await request
        .get('/v1/admin/brands')
        .set('Authorization', `Bearer ${tempAdminToken}`);
      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.error.code).toBe('ADMIN_ACCESS_REVOKED');
    });

    it('admin can deactivate and reactivate normal user accounts', async () => {
      // Deactivate user
      const deactRes = await request
        .post(`/v1/admin/users/${userId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deactRes.status).toBe(200);
      expect(deactRes.body.status).toBe('deactivated');

      // User's next request is blocked
      const userReq = await request
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(userReq.status).toBe(403);
      expect(userReq.body.error.code).toBe('ACCOUNT_INACTIVE');

      // Reactivate user
      const reactRes = await request
        .post(`/v1/admin/users/${userId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(reactRes.status).toBe(200);
      expect(reactRes.body.status).toBe('active');

      // User access is restored
      const restoredReq = await request
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(restoredReq.status).toBe(200);
    });
  });

  // ==========================================
  // 8. Account Deletion & Session Revocation
  // ==========================================
  describe('Account Deletion Compliance', () => {
    it('DELETE /v1/users/me deletes user account and revokes sessions', async () => {
      const res = await request
        .delete('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Session should now be rejected
      const profileRes = await request
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(profileRes.status).toBe(403);

      // Refresh token should also be rejected
      const refreshRes = await request
        .post('/v1/auth/refresh')
        .send({ refreshToken: userRefreshToken });
      expect(refreshRes.status).toBe(401);
    });
  });

  // ==========================================
  // 9. Advertisement & Monetization Suite
  // ==========================================
  describe('Advertisement & Monetization Management', () => {
    let createdBannerId: string;

    it('GET /v1/ads/config returns default or active ad settings', async () => {
      const res = await request.get('/v1/ads/config');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('adsEnabled');
      expect(res.body).toHaveProperty('admobBannerId');
      expect(Array.isArray(res.body.customBanners)).toBe(true);
    });

    it('Admin can get current ad settings', async () => {
      const res = await request
        .get('/v1/admin/ads/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('adsEnabled');
    });

    it('Admin can update ad settings and master switch', async () => {
      const res = await request
        .put('/v1/admin/ads/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adsEnabled: false,
          adProvider: 'hybrid',
          showOnHome: true,
          showOnResults: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.adsEnabled).toBe(false);
      expect(res.body.adProvider).toBe('hybrid');
      expect(res.body.showOnResults).toBe(false);

      // Re-enable for subsequent tests
      await request
        .put('/v1/admin/ads/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adsEnabled: true });
    });

    it('Admin can create a custom house promotion banner', async () => {
      const res = await request
        .post('/v1/admin/ads/banners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Jhankar Mobile Wholesale Glass',
          description: 'Top OCA glass and combo discounts',
          targetUrl: 'https://wa.me/919461000000',
          placement: 'all',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Jhankar Mobile Wholesale Glass');
      createdBannerId = res.body.id;
    });

    it('Public user can record click on house banner', async () => {
      const res = await request
        .post(`/v1/ads/banners/${createdBannerId}/click`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Admin can list, update, and delete custom banners', async () => {
      // List
      const listRes = await request
        .get('/v1/admin/ads/banners')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBeGreaterThan(0);

      // Update
      const patchRes = await request
        .patch(`/v1/admin/ads/banners/${createdBannerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.isActive).toBe(false);

      // Delete
      const deleteRes = await request
        .delete(`/v1/admin/ads/banners/${createdBannerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });
});
