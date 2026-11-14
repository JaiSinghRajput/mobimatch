import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    googleSub: text('google_sub').unique().notNull(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    shopName: text('shop_name').notNull(),
    city: text('city').notNull(),
    status: text('status').notNull().default('active'), // 'active' | 'deactivated' | 'deleted'
    termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }).notNull(),
    privacyAcceptedAt: timestamp('privacy_accepted_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    googleSubIdx: uniqueIndex('users_google_sub_idx').on(table.googleSub),
  })
);

// 2. Admin Allowlist Table
export const adminAllowlist = pgTable(
  'admin_allowlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailNormalized: text('email_normalized').unique().notNull(),
    addedByAdminId: uuid('added_by_admin_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailNormalizedIdx: uniqueIndex('admin_allowlist_email_normalized_idx').on(
      table.emailNormalized
    ),
  })
);

// 3. Sessions Table
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').unique().notNull(),
    deviceLabel: text('device_label'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    refreshTokenHashIdx: uniqueIndex('sessions_refresh_token_hash_idx').on(
      table.refreshTokenHash
    ),
  })
);

// 4. Brands Table
export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  },
  (table) => ({
    normalizedNameIdx: uniqueIndex('brands_normalized_name_idx').on(table.normalizedName),
  })
);

// 5. Mobile Models Table
export const mobileModels = pgTable(
  'mobile_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    modelNumber: text('model_number'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  },
  (table) => ({
    brandIdIdx: index('mobile_models_brand_id_idx').on(table.brandId),
    brandModelNormalizedIdx: uniqueIndex('mobile_models_brand_norm_idx').on(
      table.brandId,
      table.normalizedName
    ),
    modelNumberIdx: index('mobile_models_number_idx').on(table.modelNumber),
  })
);

// 6. Spare Part Categories Table
export const sparePartCategories = pgTable(
  'spare_part_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').unique().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  },
  (table) => ({
    categoryNormIdx: uniqueIndex('spare_part_categories_norm_idx').on(
      table.normalizedName
    ),
  })
);

// 7. Compatibility Groups Table
export const compatibilityGroups = pgTable(
  'compatibility_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => sparePartCategories.id),
    isActive: boolean('is_active').default(true).notNull(),
    createdByAdminId: uuid('created_by_admin_id').references(() => users.id),
    updatedByAdminId: uuid('updated_by_admin_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  },
  (table) => ({
    categoryIdIdx: index('compatibility_groups_category_id_idx').on(table.categoryId),
  })
);

// 8. Compatibility Group Members Table
export const compatibilityGroupMembers = pgTable(
  'compatibility_group_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => compatibilityGroups.id, { onDelete: 'cascade' }),
    modelId: uuid('model_id')
      .notNull()
      .references(() => mobileModels.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    groupModelUniqueIdx: uniqueIndex('group_members_group_model_unique_idx').on(
      table.groupId,
      table.modelId
    ),
    modelIdIdx: index('group_members_model_id_idx').on(table.modelId),
  })
);

// 9. Issue Reports Table
export const issueReports = pgTable(
  'issue_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    type: text('type').notNull(), // 'incorrect_compatibility' | 'wrong_mobile_model' | 'missing_compatible_model' | 'other'
    categoryId: uuid('category_id').references(() => sparePartCategories.id),
    modelId: uuid('model_id').references(() => mobileModels.id),
    groupId: uuid('group_id').references(() => compatibilityGroups.id),
    description: text('description'),
    status: text('status').default('open').notNull(), // 'open' | 'reviewing' | 'resolved' | 'rejected'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('issue_reports_user_id_idx').on(table.userId),
    statusIdx: index('issue_reports_status_idx').on(table.status),
  })
);

// 10. Model Requests Table
export const modelRequests = pgTable(
  'model_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    brandNameSubmitted: text('brand_name_submitted').notNull(),
    modelNameSubmitted: text('model_name_submitted').notNull(),
    modelNumberSubmitted: text('model_number_submitted'),
    notes: text('notes'),
    status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
    reviewedByAdminId: uuid('reviewed_by_admin_id').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('model_requests_user_id_idx').on(table.userId),
    statusIdx: index('model_requests_status_idx').on(table.status),
  })
);

// 11. Ad Settings Table
export const adSettings = pgTable('ad_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  adsEnabled: boolean('ads_enabled').default(true).notNull(),
  adProvider: text('ad_provider').default('admob').notNull(),
  admobAppId: text('admob_app_id').default('ca-app-pub-3940256099942544~3347511713').notNull(),
  admobBannerId: text('admob_banner_id').default('ca-app-pub-3940256099942544/6300978111').notNull(),
  admobInterstitialId: text('admob_interstitial_id').default('ca-app-pub-3940256099942544/1033173712').notNull(),
  admobRewardedId: text('admob_rewarded_id').default('ca-app-pub-3940256099942544/5224354917').notNull(),
  showOnHome: boolean('show_on_home').default(true).notNull(),
  showOnResults: boolean('show_on_results').default(true).notNull(),
  showOnCatalog: boolean('show_on_catalog').default(true).notNull(),
  bannerRefreshIntervalSec: integer('banner_refresh_interval_sec').default(30).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 12. Custom Banners Table
export const customBanners = pgTable('custom_banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  targetUrl: text('target_url').notNull(),
  placement: text('placement').default('all').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  clickCount: integer('click_count').default(0).notNull(),
  impressionCount: integer('impression_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// Drizzle Relations Definitions
// -------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  issueReports: many(issueReports),
  modelRequests: many(modelRequests),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  models: many(mobileModels),
}));

export const mobileModelsRelations = relations(mobileModels, ({ one, many }) => ({
  brand: one(brands, {
    fields: [mobileModels.brandId],
    references: [brands.id],
  }),
  groupMemberships: many(compatibilityGroupMembers),
}));

export const sparePartCategoriesRelations = relations(
  sparePartCategories,
  ({ many }) => ({
    compatibilityGroups: many(compatibilityGroups),
  })
);

export const compatibilityGroupsRelations = relations(
  compatibilityGroups,
  ({ one, many }) => ({
    category: one(sparePartCategories, {
      fields: [compatibilityGroups.categoryId],
      references: [sparePartCategories.id],
    }),
    members: many(compatibilityGroupMembers),
  })
);

export const compatibilityGroupMembersRelations = relations(
  compatibilityGroupMembers,
  ({ one }) => ({
    group: one(compatibilityGroups, {
      fields: [compatibilityGroupMembers.groupId],
      references: [compatibilityGroups.id],
    }),
    model: one(mobileModels, {
      fields: [compatibilityGroupMembers.modelId],
      references: [mobileModels.id],
    }),
  })
);
