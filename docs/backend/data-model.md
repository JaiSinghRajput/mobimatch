# Backend Data Model

This is a minimal relational model proposal. Use migrations. Names can be adapted to ORM conventions while preserving constraints and semantics.

## 1. `users`

- `id` UUID primary key.
- `google_sub` text unique not null — verified Google subject identifier.
- `email` citext/text not null — verified email snapshot.
- `name` text not null — Google profile snapshot.
- `phone` text not null.
- `shop_name` text not null.
- `city` text not null.
- `status` enum: `active`, `deactivated`, `deleted`.
- `terms_accepted_at` timestamptz not null.
- `privacy_accepted_at` timestamptz not null.
- `created_at`, `updated_at`.
- `deleted_at` nullable.

Do not use email as the stable Google identity key. Google subject (`sub`) is the stable account identifier. Do not store unnecessary Google tokens.

## 2. `admin_allowlist`

- `id` UUID primary key.
- `email_normalized` citext unique not null.
- `added_by_admin_id` nullable FK to users.
- `created_at` timestamptz.

Admin status is derived from verified identity email matching this table. No client-editable `is_admin` flag. First admin is bootstrapped from `INITIAL_ADMIN_EMAIL` once during initial deployment/seed. Do not automatically reinsert it on each startup.

## 3. `sessions`

- `id` UUID primary key.
- `user_id` FK users.
- `refresh_token_hash` text unique not null.
- `device_label` text nullable (user-provided or generic; do not fingerprint device).
- `created_at`, `last_used_at`, `expires_at`, `revoked_at`.

Store only hashed refresh tokens. Support revoking one session and all sessions for a user. Avoid collecting hardware identifiers.

## 4. `brands`

- `id` UUID primary key.
- `name` text not null.
- `normalized_name` text not null, indexed.
- `is_active` boolean not null default true.
- `created_at`, `updated_at`, `deactivated_at`.

Normal user APIs return active brands only. Deactivation preserves rows and relationships.

## 5. `mobile_models`

- `id` UUID primary key.
- `brand_id` FK brands not null.
- `name` text not null.
- `normalized_name` text not null.
- `model_number` text nullable; duplicates allowed.
- `is_active` boolean not null default true.
- `created_at`, `updated_at`, `deactivated_at`.

Indexes: `(brand_id, normalized_name)`, normalized model name, optional model number. Do not enforce global uniqueness on model number. Consider uniqueness on `(brand_id, normalized_name)` only if owner approves the normalization rule; otherwise detect duplicate candidates in admin UI.

## 6. `spare_part_categories`

- `id` UUID primary key.
- `name` text not null.
- `normalized_name` text not null unique.
- `is_active` boolean not null default true.
- `created_at`, `updated_at`, `deactivated_at`.

User APIs return active categories alphabetically.

## 7. `compatibility_groups`

- `id` UUID primary key.
- `category_id` FK spare_part_categories not null.
- `is_active` boolean not null default true.
- `created_by_admin_id` FK users nullable.
- `updated_by_admin_id` FK users nullable.
- `created_at`, `updated_at`, `deactivated_at`.

## 8. `compatibility_group_members`

- `id` UUID primary key.
- `group_id` FK compatibility_groups not null.
- `model_id` FK mobile_models not null.
- `created_at` timestamptz.
- Unique `(group_id, model_id)`.

MVP business rule: for a given category and active model, there should be at most one active group membership. Enforce this in the publish transaction and conflict validator. Avoid a schema shape that prevents a future model from belonging to multiple groups in one category; the future product may distinguish part variants.

## 9. `issue_reports`

- `id` UUID primary key.
- `user_id` FK users nullable after deletion/anonymization.
- `type` enum: `incorrect_compatibility`, `wrong_mobile_model`, `missing_compatible_model`, `other`.
- `category_id` nullable FK categories.
- `model_id` nullable FK mobile_models.
- `group_id` nullable FK compatibility_groups.
- `description` text nullable with length limit.
- `status` enum: `open`, `reviewing`, `resolved`, `rejected`.
- `created_at`, `updated_at`.

## 10. `model_requests`

- `id` UUID primary key.
- `user_id` FK users nullable after deletion/anonymization.
- `brand_name_submitted` text not null.
- `model_name_submitted` text not null.
- `model_number_submitted` text nullable.
- `notes` text nullable.
- `status` enum: `pending`, `approved`, `rejected`.
- `reviewed_by_admin_id` FK users nullable.
- `reviewed_at`, `created_at`, `updated_at`.

Approval does not auto-create model; admin must confirm/create it.

## 11. Optional `compatibility_publish_snapshots`

Only add if basic restore is feasible within the project budget:

- `id` UUID primary key.
- `category_id` FK.
- `snapshot_json` JSONB containing prior group membership for affected category/models.
- `created_by_admin_id` FK users.
- `created_at`.

Keep snapshots bounded (e.g. last successful publish per category) rather than building unlimited history. If not implemented, document rollback as deferred and rely on transactional publish plus database backups.

## 12. Data deletion

When a user deletes their account:

- Revoke all sessions immediately.
- Delete or irreversibly anonymize profile identifiers and personal data.
- Delete or anonymize user-linked reports/requests according to the disclosed retention policy and legal requirements.
- Do not retain personal data merely for analytics convenience.
- Do not delete shared catalog or compatibility data that is not personal data.
- Ensure the public deletion URL and in-app deletion flow have consistent outcomes.
