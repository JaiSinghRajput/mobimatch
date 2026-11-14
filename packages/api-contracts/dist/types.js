"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCustomBannerRequestSchema = exports.CustomBannerSchema = exports.UpdateAdSettingsRequestSchema = exports.AdSettingsSchema = exports.AppConfigResponseSchema = exports.AddAdminAllowlistRequestSchema = exports.AdminAllowlistEntrySchema = exports.ModelRequestItemSchema = exports.CreateModelRequestSchema = exports.ModelRequestStatusSchema = exports.IssueReportSchema = exports.CreateIssueReportRequestSchema = exports.IssueReportStatusSchema = exports.IssueReportTypeSchema = exports.PublishCompatibilityRequestSchema = exports.ConflictActionSchema = exports.ParsePreviewResponseSchema = exports.ConflictItemSchema = exports.ResolvedModelMatchSchema = exports.ParsedLineSchema = exports.ParsedModelTokenSchema = exports.CompatibilityResultSchema = exports.CompatibilityGroupMemberItemSchema = exports.ModelSearchItemSchema = exports.SparePartCategorySchema = exports.MobileModelSchema = exports.BrandSchema = exports.UserProfileSchema = exports.UpdateProfileRequestSchema = exports.CompleteProfileRequestSchema = exports.TokenResponseSchema = exports.RefreshTokenRequestSchema = exports.GoogleAuthRequestSchema = exports.ClientAppTypeSchema = exports.UserStatusSchema = void 0;
const zod_1 = require("zod");
// ==========================================
// User & Auth Schemas & Types
// ==========================================
exports.UserStatusSchema = zod_1.z.enum(['active', 'deactivated', 'deleted']);
exports.ClientAppTypeSchema = zod_1.z.enum(['user', 'admin']);
exports.GoogleAuthRequestSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1, 'ID token is required'),
    clientApp: exports.ClientAppTypeSchema.default('user'),
});
exports.RefreshTokenRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.TokenResponseSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    expiresIn: zod_1.z.number(), // in seconds
    user: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        email: zod_1.z.string().email(),
        name: zod_1.z.string(),
        phone: zod_1.z.string().nullable().optional(),
        shopName: zod_1.z.string().nullable().optional(),
        city: zod_1.z.string().nullable().optional(),
        status: exports.UserStatusSchema,
        isAdmin: zod_1.z.boolean(),
        isProfileComplete: zod_1.z.boolean(),
    }),
});
exports.CompleteProfileRequestSchema = zod_1.z.object({
    phone: zod_1.z.string().min(6, 'Valid phone number is required').max(20),
    shopName: zod_1.z.string().min(2, 'Shop name is required').max(100),
    city: zod_1.z.string().min(2, 'City is required').max(100),
    termsAccepted: zod_1.z.literal(true, {
        errorMap: () => ({ message: 'Terms & Conditions acceptance is required' }),
    }),
    privacyAccepted: zod_1.z.literal(true, {
        errorMap: () => ({ message: 'Privacy Policy acceptance is required' }),
    }),
});
exports.UpdateProfileRequestSchema = zod_1.z.object({
    phone: zod_1.z.string().min(6).max(20).optional(),
    shopName: zod_1.z.string().min(2).max(100).optional(),
    city: zod_1.z.string().min(2).max(100).optional(),
});
exports.UserProfileSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    phone: zod_1.z.string(),
    shopName: zod_1.z.string(),
    city: zod_1.z.string(),
    status: exports.UserStatusSchema,
    isAdmin: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
// ==========================================
// Catalog Schemas & Types
// ==========================================
exports.BrandSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    normalizedName: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    deactivatedAt: zod_1.z.string().nullable().optional(),
});
exports.MobileModelSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    brandId: zod_1.z.string().uuid(),
    brandName: zod_1.z.string().optional(),
    name: zod_1.z.string(),
    normalizedName: zod_1.z.string(),
    modelNumber: zod_1.z.string().nullable().optional(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    deactivatedAt: zod_1.z.string().nullable().optional(),
});
exports.SparePartCategorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    normalizedName: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    deactivatedAt: zod_1.z.string().nullable().optional(),
});
exports.ModelSearchItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    brandId: zod_1.z.string().uuid(),
    brandName: zod_1.z.string(),
    modelNumber: zod_1.z.string().nullable().optional(),
});
exports.CompatibilityGroupMemberItemSchema = zod_1.z.object({
    modelId: zod_1.z.string().uuid(),
    modelName: zod_1.z.string(),
    brandId: zod_1.z.string().uuid(),
    brandName: zod_1.z.string(),
    modelNumber: zod_1.z.string().nullable().optional(),
});
exports.CompatibilityResultSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    categoryName: zod_1.z.string(),
    selectedModel: exports.CompatibilityGroupMemberItemSchema,
    groupId: zod_1.z.string().uuid(),
    totalCount: zod_1.z.number(),
    models: zod_1.z.array(exports.CompatibilityGroupMemberItemSchema),
});
// ==========================================
// Compatibility Parser & Admin Publishing
// ==========================================
exports.ParsedModelTokenSchema = zod_1.z.object({
    raw: zod_1.z.string(),
    normalized: zod_1.z.string(),
    brandHint: zod_1.z.string().optional(),
    modelNameHint: zod_1.z.string(),
});
exports.ParsedLineSchema = zod_1.z.object({
    lineNumber: zod_1.z.number(),
    rawLine: zod_1.z.string(),
    tokens: zod_1.z.array(exports.ParsedModelTokenSchema),
    error: zod_1.z.string().nullable().optional(),
});
exports.ResolvedModelMatchSchema = zod_1.z.object({
    rawInput: zod_1.z.string(),
    status: zod_1.z.enum(['matched', 'missing_model', 'missing_brand', 'ambiguous']),
    matchedModel: exports.MobileModelSchema.nullable().optional(),
    candidateModels: zod_1.z.array(exports.MobileModelSchema).optional(),
    suggestedBrandName: zod_1.z.string().optional(),
    suggestedModelName: zod_1.z.string().optional(),
});
exports.ConflictItemSchema = zod_1.z.object({
    modelId: zod_1.z.string().uuid(),
    modelName: zod_1.z.string(),
    brandName: zod_1.z.string(),
    existingGroupId: zod_1.z.string().uuid(),
    proposedLineNumber: zod_1.z.number(),
    existingGroupMemberCount: zod_1.z.number(),
});
exports.ParsePreviewResponseSchema = zod_1.z.object({
    previewId: zod_1.z.string(),
    categoryId: zod_1.z.string().uuid(),
    categoryName: zod_1.z.string(),
    lines: zod_1.z.array(zod_1.z.object({
        lineNumber: zod_1.z.number(),
        rawLine: zod_1.z.string(),
        models: zod_1.z.array(exports.ResolvedModelMatchSchema),
        valid: zod_1.z.boolean(),
        errorMessage: zod_1.z.string().nullable().optional(),
    })),
    totalGroups: zod_1.z.number(),
    missingBrands: zod_1.z.array(zod_1.z.string()),
    missingModels: zod_1.z.array(zod_1.z.object({
        brandName: zod_1.z.string(),
        modelName: zod_1.z.string(),
    })),
    ambiguousModels: zod_1.z.array(zod_1.z.object({
        rawInput: zod_1.z.string(),
        candidates: zod_1.z.array(exports.MobileModelSchema),
    })),
    conflicts: zod_1.z.array(exports.ConflictItemSchema),
    canPublishImmediately: zod_1.z.boolean(),
});
exports.ConflictActionSchema = zod_1.z.enum(['merge', 'cancel']);
exports.PublishCompatibilityRequestSchema = zod_1.z.object({
    previewId: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid(),
    lines: zod_1.z.array(zod_1.z.object({
        models: zod_1.z.array(zod_1.z.object({
            brandName: zod_1.z.string(),
            modelName: zod_1.z.string(),
            modelNumber: zod_1.z.string().nullable().optional(),
            createIfMissing: zod_1.z.boolean().default(false),
            resolvedModelId: zod_1.z.string().uuid().optional(),
        })),
    })),
    conflictResolutions: zod_1.z
        .record(exports.ConflictActionSchema)
        .optional()
        .describe('Mapping of modelId to action: merge or cancel'),
});
// ==========================================
// Reports & Model Requests
// ==========================================
exports.IssueReportTypeSchema = zod_1.z.enum([
    'incorrect_compatibility',
    'wrong_mobile_model',
    'missing_compatible_model',
    'other',
]);
exports.IssueReportStatusSchema = zod_1.z.enum(['open', 'reviewing', 'resolved', 'rejected']);
exports.CreateIssueReportRequestSchema = zod_1.z.object({
    type: exports.IssueReportTypeSchema,
    categoryId: zod_1.z.string().uuid().optional(),
    modelId: zod_1.z.string().uuid().optional(),
    groupId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().max(1000).optional(),
});
exports.IssueReportSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid().nullable(),
    type: exports.IssueReportTypeSchema,
    categoryId: zod_1.z.string().uuid().nullable().optional(),
    categoryName: zod_1.z.string().nullable().optional(),
    modelId: zod_1.z.string().uuid().nullable().optional(),
    modelName: zod_1.z.string().nullable().optional(),
    groupId: zod_1.z.string().uuid().nullable().optional(),
    description: zod_1.z.string().nullable().optional(),
    status: exports.IssueReportStatusSchema,
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.ModelRequestStatusSchema = zod_1.z.enum(['pending', 'approved', 'rejected']);
exports.CreateModelRequestSchema = zod_1.z.object({
    brandName: zod_1.z.string().min(1, 'Brand name is required').max(50),
    modelName: zod_1.z.string().min(1, 'Model name is required').max(100),
    modelNumber: zod_1.z.string().max(50).optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.ModelRequestItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid().nullable(),
    brandNameSubmitted: zod_1.z.string(),
    modelNameSubmitted: zod_1.z.string(),
    modelNumberSubmitted: zod_1.z.string().nullable().optional(),
    notes: zod_1.z.string().nullable().optional(),
    status: exports.ModelRequestStatusSchema,
    reviewedByAdminId: zod_1.z.string().uuid().nullable().optional(),
    reviewedAt: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
// ==========================================
// Admin Allowlist & App Config
// ==========================================
exports.AdminAllowlistEntrySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    emailNormalized: zod_1.z.string(),
    addedByAdminId: zod_1.z.string().uuid().nullable().optional(),
    createdAt: zod_1.z.string(),
});
exports.AddAdminAllowlistRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.AppConfigResponseSchema = zod_1.z.object({
    isMaintenanceMode: zod_1.z.boolean(),
    maintenanceMessage: zod_1.z.string(),
    minUserAppVersion: zod_1.z.string(),
    latestUserAppVersion: zod_1.z.string(),
    userAppUpdateUrl: zod_1.z.string(),
    minAdminAppVersion: zod_1.z.string(),
    latestAdminAppVersion: zod_1.z.string(),
    adminAppUpdateUrl: zod_1.z.string(),
    termsUrl: zod_1.z.string(),
    privacyPolicyUrl: zod_1.z.string(),
    accountDeletionUrl: zod_1.z.string(),
});
// ==========================================
// Advertisement Management
// ==========================================
exports.AdSettingsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    adsEnabled: zod_1.z.boolean(),
    adProvider: zod_1.z.string(),
    admobAppId: zod_1.z.string(),
    admobBannerId: zod_1.z.string(),
    admobInterstitialId: zod_1.z.string(),
    admobRewardedId: zod_1.z.string(),
    showOnHome: zod_1.z.boolean(),
    showOnResults: zod_1.z.boolean(),
    showOnCatalog: zod_1.z.boolean(),
    bannerRefreshIntervalSec: zod_1.z.number().int(),
    updatedAt: zod_1.z.string().optional(),
});
exports.UpdateAdSettingsRequestSchema = zod_1.z.object({
    adsEnabled: zod_1.z.boolean().optional(),
    adProvider: zod_1.z.string().optional(),
    admobAppId: zod_1.z.string().optional(),
    admobBannerId: zod_1.z.string().optional(),
    admobInterstitialId: zod_1.z.string().optional(),
    admobRewardedId: zod_1.z.string().optional(),
    showOnHome: zod_1.z.boolean().optional(),
    showOnResults: zod_1.z.boolean().optional(),
    showOnCatalog: zod_1.z.boolean().optional(),
    bannerRefreshIntervalSec: zod_1.z.number().int().optional(),
});
exports.CustomBannerSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    imageUrl: zod_1.z.string().nullable().optional(),
    targetUrl: zod_1.z.string(),
    placement: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    clickCount: zod_1.z.number().int(),
    impressionCount: zod_1.z.number().int(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string().optional(),
});
exports.CreateCustomBannerRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    imageUrl: zod_1.z.string().nullable().optional(),
    targetUrl: zod_1.z.string().min(1),
    placement: zod_1.z.string().default('all'),
    isActive: zod_1.z.boolean().default(true),
});
//# sourceMappingURL=types.js.map