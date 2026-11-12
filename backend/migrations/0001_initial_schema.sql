-- MobiMatch Initial Database Migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_sub TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    city TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    privacy_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_idx ON users(google_sub);

-- 2. Admin Allowlist
CREATE TABLE IF NOT EXISTS admin_allowlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_normalized TEXT UNIQUE NOT NULL,
    added_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_allowlist_email_normalized_idx ON admin_allowlist(email_normalized);

-- 3. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT UNIQUE NOT NULL,
    device_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_refresh_token_hash_idx ON sessions(refresh_token_hash);

-- 4. Brands
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS brands_normalized_name_idx ON brands(normalized_name);

-- 5. Mobile Models
CREATE TABLE IF NOT EXISTS mobile_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    model_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS mobile_models_brand_id_idx ON mobile_models(brand_id);
CREATE INDEX IF NOT EXISTS mobile_models_brand_norm_idx ON mobile_models(brand_id, normalized_name);
CREATE INDEX IF NOT EXISTS mobile_models_number_idx ON mobile_models(model_number);

-- 6. Spare Part Categories
CREATE TABLE IF NOT EXISTS spare_part_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    normalized_name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS spare_part_categories_norm_idx ON spare_part_categories(normalized_name);

-- 7. Compatibility Groups
CREATE TABLE IF NOT EXISTS compatibility_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES spare_part_categories(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS compatibility_groups_category_id_idx ON compatibility_groups(category_id);

-- 8. Compatibility Group Members
CREATE TABLE IF NOT EXISTS compatibility_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES compatibility_groups(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES mobile_models(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_model_unique_idx ON compatibility_group_members(group_id, model_id);
CREATE INDEX IF NOT EXISTS group_members_model_id_idx ON compatibility_group_members(model_id);

-- 9. Issue Reports
CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    category_id UUID REFERENCES spare_part_categories(id) ON DELETE SET NULL,
    model_id UUID REFERENCES mobile_models(id) ON DELETE SET NULL,
    group_id UUID REFERENCES compatibility_groups(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS issue_reports_user_id_idx ON issue_reports(user_id);
CREATE INDEX IF NOT EXISTS issue_reports_status_idx ON issue_reports(status);

-- 10. Model Requests
CREATE TABLE IF NOT EXISTS model_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    brand_name_submitted TEXT NOT NULL,
    model_name_submitted TEXT NOT NULL,
    model_number_submitted TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS model_requests_user_id_idx ON model_requests(user_id);
CREATE INDEX IF NOT EXISTS model_requests_status_idx ON model_requests(status);

