import { z } from 'zod';

// ==========================================
// User & Auth Schemas & Types
// ==========================================

export const UserStatusSchema = z.enum(['active', 'deactivated', 'deleted']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const ClientAppTypeSchema = z.enum(['user', 'admin']);
export type ClientAppType = z.infer<typeof ClientAppTypeSchema>;

export const GoogleAuthRequestSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  clientApp: ClientAppTypeSchema.default('user'),
});
export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestSchema>;

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(), // in seconds
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    phone: z.string().nullable().optional(),
    shopName: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    status: UserStatusSchema,
    isAdmin: z.boolean(),
    isProfileComplete: z.boolean(),
  }),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const CompleteProfileRequestSchema = z.object({
  phone: z.string().min(6, 'Valid phone number is required').max(20),
  shopName: z.string().min(2, 'Shop name is required').max(100),
  city: z.string().min(2, 'City is required').max(100),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Terms & Conditions acceptance is required' }),
  }),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Privacy Policy acceptance is required' }),
  }),
});
export type CompleteProfileRequest = z.infer<typeof CompleteProfileRequestSchema>;

export const UpdateProfileRequestSchema = z.object({
  phone: z.string().min(6).max(20).optional(),
  shopName: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string(),
  shopName: z.string(),
  city: z.string(),
  status: UserStatusSchema,
  isAdmin: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ==========================================
// Catalog Schemas & Types
// ==========================================

export const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  normalizedName: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deactivatedAt: z.string().nullable().optional(),
});
export type Brand = z.infer<typeof BrandSchema>;

export const MobileModelSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  brandName: z.string().optional(),
  name: z.string(),
  normalizedName: z.string(),
  modelNumber: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deactivatedAt: z.string().nullable().optional(),
});
export type MobileModel = z.infer<typeof MobileModelSchema>;

export const SparePartCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  normalizedName: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deactivatedAt: z.string().nullable().optional(),
});
export type SparePartCategory = z.infer<typeof SparePartCategorySchema>;

export const ModelSearchItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  brandId: z.string().uuid(),
  brandName: z.string(),
  modelNumber: z.string().nullable().optional(),
});
export type ModelSearchItem = z.infer<typeof ModelSearchItemSchema>;

export const CompatibilityGroupMemberItemSchema = z.object({
  modelId: z.string().uuid(),
  modelName: z.string(),
  brandId: z.string().uuid(),
  brandName: z.string(),
  modelNumber: z.string().nullable().optional(),
});
export type CompatibilityGroupMemberItem = z.infer<typeof CompatibilityGroupMemberItemSchema>;

export const CompatibilityResultSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  selectedModel: CompatibilityGroupMemberItemSchema,
  groupId: z.string().uuid(),
  totalCount: z.number(),
  models: z.array(CompatibilityGroupMemberItemSchema),
});
export type CompatibilityResult = z.infer<typeof CompatibilityResultSchema>;

// ==========================================
// Compatibility Parser & Admin Publishing
// ==========================================

export const ParsedModelTokenSchema = z.object({
  raw: z.string(),
  normalized: z.string(),
  brandHint: z.string().optional(),
  modelNameHint: z.string(),
});
export type ParsedModelToken = z.infer<typeof ParsedModelTokenSchema>;

export const ParsedLineSchema = z.object({
  lineNumber: z.number(),
  rawLine: z.string(),
  tokens: z.array(ParsedModelTokenSchema),
  error: z.string().nullable().optional(),
});
export type ParsedLine = z.infer<typeof ParsedLineSchema>;

export const ResolvedModelMatchSchema = z.object({
  rawInput: z.string(),
  status: z.enum(['matched', 'missing_model', 'missing_brand', 'ambiguous']),
  matchedModel: MobileModelSchema.nullable().optional(),
  candidateModels: z.array(MobileModelSchema).optional(),
  suggestedBrandName: z.string().optional(),
  suggestedModelName: z.string().optional(),
});
export type ResolvedModelMatch = z.infer<typeof ResolvedModelMatchSchema>;

export const ConflictItemSchema = z.object({
  modelId: z.string().uuid(),
  modelName: z.string(),
  brandName: z.string(),
  existingGroupId: z.string().uuid(),
  proposedLineNumber: z.number(),
  existingGroupMemberCount: z.number(),
});
export type ConflictItem = z.infer<typeof ConflictItemSchema>;

export const ParsePreviewResponseSchema = z.object({
  previewId: z.string(),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  lines: z.array(
    z.object({
      lineNumber: z.number(),
      rawLine: z.string(),
      models: z.array(ResolvedModelMatchSchema),
      valid: z.boolean(),
      errorMessage: z.string().nullable().optional(),
    })
  ),
  totalGroups: z.number(),
  missingBrands: z.array(z.string()),
  missingModels: z.array(
    z.object({
      brandName: z.string(),
      modelName: z.string(),
    })
  ),
  ambiguousModels: z.array(
    z.object({
      rawInput: z.string(),
      candidates: z.array(MobileModelSchema),
    })
  ),
  conflicts: z.array(ConflictItemSchema),
  canPublishImmediately: z.boolean(),
});
export type ParsePreviewResponse = z.infer<typeof ParsePreviewResponseSchema>;

export const ConflictActionSchema = z.enum(['merge', 'cancel']);
export type ConflictAction = z.infer<typeof ConflictActionSchema>;

export const PublishCompatibilityRequestSchema = z.object({
  previewId: z.string().optional(),
  categoryId: z.string().uuid(),
  lines: z.array(
    z.object({
      models: z.array(
        z.object({
          brandName: z.string(),
          modelName: z.string(),
          modelNumber: z.string().nullable().optional(),
          createIfMissing: z.boolean().default(false),
          resolvedModelId: z.string().uuid().optional(),
        })
      ),
    })
  ),
  conflictResolutions: z
    .record(ConflictActionSchema)
    .optional()
    .describe('Mapping of modelId to action: merge or cancel'),
});
export type PublishCompatibilityRequest = z.infer<typeof PublishCompatibilityRequestSchema>;

// ==========================================
// Reports & Model Requests
// ==========================================

export const IssueReportTypeSchema = z.enum([
  'incorrect_compatibility',
  'wrong_mobile_model',
  'missing_compatible_model',
  'other',
]);
export type IssueReportType = z.infer<typeof IssueReportTypeSchema>;

export const IssueReportStatusSchema = z.enum(['open', 'reviewing', 'resolved', 'rejected']);
export type IssueReportStatus = z.infer<typeof IssueReportStatusSchema>;

export const CreateIssueReportRequestSchema = z.object({
  type: IssueReportTypeSchema,
  categoryId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
});
export type CreateIssueReportRequest = z.infer<typeof CreateIssueReportRequestSchema>;

export const IssueReportSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  type: IssueReportTypeSchema,
  categoryId: z.string().uuid().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  modelId: z.string().uuid().nullable().optional(),
  modelName: z.string().nullable().optional(),
  groupId: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  status: IssueReportStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IssueReport = z.infer<typeof IssueReportSchema>;

export const ModelRequestStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type ModelRequestStatus = z.infer<typeof ModelRequestStatusSchema>;

export const CreateModelRequestSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required').max(50),
  modelName: z.string().min(1, 'Model name is required').max(100),
  modelNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});
export type CreateModelRequest = z.infer<typeof CreateModelRequestSchema>;

export const ModelRequestItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  brandNameSubmitted: z.string(),
  modelNameSubmitted: z.string(),
  modelNumberSubmitted: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: ModelRequestStatusSchema,
  reviewedByAdminId: z.string().uuid().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ModelRequestItem = z.infer<typeof ModelRequestItemSchema>;

// ==========================================
// Admin Allowlist & App Config
// ==========================================

export const AdminAllowlistEntrySchema = z.object({
  id: z.string().uuid(),
  emailNormalized: z.string(),
  addedByAdminId: z.string().uuid().nullable().optional(),
  createdAt: z.string(),
});
export type AdminAllowlistEntry = z.infer<typeof AdminAllowlistEntrySchema>;

export const AddAdminAllowlistRequestSchema = z.object({
  email: z.string().email(),
});
export type AddAdminAllowlistRequest = z.infer<typeof AddAdminAllowlistRequestSchema>;

export const AppConfigResponseSchema = z.object({
  isMaintenanceMode: z.boolean(),
  maintenanceMessage: z.string(),
  minUserAppVersion: z.string(),
  latestUserAppVersion: z.string(),
  userAppUpdateUrl: z.string(),
  minAdminAppVersion: z.string(),
  latestAdminAppVersion: z.string(),
  adminAppUpdateUrl: z.string(),
  termsUrl: z.string(),
  privacyPolicyUrl: z.string(),
  accountDeletionUrl: z.string(),
});
export type AppConfigResponse = z.infer<typeof AppConfigResponseSchema>;

// ==========================================
// Advertisement Management
// ==========================================

export const AdSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  adsEnabled: z.boolean(),
  adProvider: z.string(),
  admobAppId: z.string(),
  admobBannerId: z.string(),
  admobInterstitialId: z.string(),
  admobRewardedId: z.string(),
  showOnHome: z.boolean(),
  showOnResults: z.boolean(),
  showOnCatalog: z.boolean(),
  bannerRefreshIntervalSec: z.number().int(),
  updatedAt: z.string().optional(),
});
export type AdSettings = z.infer<typeof AdSettingsSchema>;

export const UpdateAdSettingsRequestSchema = z.object({
  adsEnabled: z.boolean().optional(),
  adProvider: z.string().optional(),
  admobAppId: z.string().optional(),
  admobBannerId: z.string().optional(),
  admobInterstitialId: z.string().optional(),
  admobRewardedId: z.string().optional(),
  showOnHome: z.boolean().optional(),
  showOnResults: z.boolean().optional(),
  showOnCatalog: z.boolean().optional(),
  bannerRefreshIntervalSec: z.number().int().optional(),
});
export type UpdateAdSettingsRequest = z.infer<typeof UpdateAdSettingsRequestSchema>;

export const CustomBannerSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable().optional(),
  targetUrl: z.string(),
  placement: z.string(),
  isActive: z.boolean(),
  clickCount: z.number().int(),
  impressionCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type CustomBanner = z.infer<typeof CustomBannerSchema>;

export const CreateCustomBannerRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  targetUrl: z.string().min(1),
  placement: z.string().default('all'),
  isActive: z.boolean().default(true),
});
export type CreateCustomBannerRequest = z.infer<typeof CreateCustomBannerRequestSchema>;

