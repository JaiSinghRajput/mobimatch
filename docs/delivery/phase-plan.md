# Delivery Plan and Scope Guardrail

## 1. Commercial baseline

- Agreed development fee: **₹8,000**.
- Client pays VPS, domain, Play Console account fees, and third-party/hosting charges directly.
- 30 days of bug-fix support after delivery.
- New features/enhancements require separate quote and client approval.
- Developer retains source-code ownership; client receives the agreed exclusive commercial-use licence after full payment. Refer to the separate simple project agreement for final wording.

## 2. Core MVP only — Implementation Status

Build order and completed delivery:

### Milestone 1 — Foundation (Completed)

- [x] Repository and three deployables (`backend/`, `mobimatch-admin/`, `mobimatch/`, plus `packages/api-contracts`).
- [x] Development/production config templates (`.env.example`, `docker-compose.yml`, root `package.json`).
- [x] PostgreSQL schema and migrations (`0001_initial_schema.sql` with Drizzle ORM).
- [x] Backend health (`/health/live`, `/health/ready`) and `/v1/app-config` endpoints.
- [x] Basic app navigation, styling and theme in both mobile apps.

### Milestone 2 — Authentication and profile (Completed)

- [x] Google sign-in verification (official Google library + dev mock mode).
- [x] User account/profile mandatory completion and legal acceptance.
- [x] Admin allowlist authorization with immediate server-side revocation check on every request.
- [x] Session refresh rotation, logout, and logout-all-devices.
- [x] Deactivation checks on all protected routes.

### Milestone 3 — Catalog and search (Completed)

- [x] Brands/models/categories CRUD with soft deactivation and reactivation.
- [x] Active/inactive behaviour preserving data and relationships.
- [x] Alphabetical browsing (A–Z).
- [x] Global search by brand, model, and optional model number with partial matching & suggestions.
- [x] Redis response caching with automatic invalidation on mutations and graceful direct DB fallback.

### Milestone 4 — Compatibility (Completed)

- [x] Manual group management and category selection.
- [x] Multiline parser preview (`POST /v1/admin/compatibility/parse-preview`).
- [x] Missing model/brand confirmation and candidate identification.
- [x] Overlapping group conflict detection with explicit merge/cancel choice.
- [x] Transactional publish with atomic rollback (`POST /v1/admin/compatibility/publish`).
- [x] User compatibility result screen and clipboard Copy List action.

### Milestone 5 — Reports and requests (Completed)

- [x] Issue report creation and admin status management (`open`, `reviewing`, `resolved`, `rejected`).
- [x] Missing-model request creation and admin review (`pending`, `approved`, `rejected`).
- [x] Admin user management (list, view, deactivate, reactivate).
- [x] Admin allowlist management (list, add, remove with last-admin guardrail).

### Milestone 6 — Release readiness (Completed)

- [x] Account deletion in app and public web resource (`GET /account-deletion`).
- [x] Comprehensive automated test suite (39 unit and integration tests passing).
- [x] Dockerfile, docker-compose.yml, and environment configs.
- [x] Android release configs configured (`minSdkVersion=29`, `targetSdkVersion=36`, minimal permissions).

## 3. Budget reality

₹8,000 is extremely tight for two Android apps, OAuth, backend, parser, database, Redis, deployment and release compliance. This plan is a scope prioritization guide, not a promise that every listed enhancement can be delivered at production depth within the fee.

To stay within budget:

- Use a shared mobile code foundation where possible but retain separate app identities/builds.
- Use one backend modular monolith.
- Avoid advanced dashboards, animations, complex design system, and extra SDKs.
- Do not build Phase 2 features.
- Use a basic admin interface and straightforward forms.
- Implement only the parser safeguards necessary for safe publishing.
- If basic rollback is too expensive, defer it and rely on transactional publishing plus database backups; tell client first.
- If typo-tolerant search is too expensive, deliver partial search first and explicitly defer advanced typo tolerance.

## 4. Phase 2 backlog

- AdMob and admin-managed custom ads.
- Detailed analytics.
- Announcements.
- WhatsApp support button and editable support number.
- CSV/Excel import.
- Hindi and other languages.
- Professional logo/branding.
- Full compatibility version history and rollback.
- Result-screen report button (not yet confirmed).

## 5. Client inputs required before release

- Client business/legal name and contact details.
- Primary owner email for outage alerts.
- Initial admin email (`INITIAL_ADMIN_EMAIL`).
- Google OAuth/Cloud project ownership and app configuration approvals.
- Domain name for privacy policy and account-deletion web page.
- VPS selection/payment.
- Play Console account ownership and distribution choice.
- Final Terms & Conditions and Privacy Policy review/approval.
- App package IDs and final display names.
- Any real compatibility data for initial population.

## 6. Open decisions to resolve before release

1. Admin distribution: direct APK (sideload warning possible) vs Play-managed private/testing distribution.
2. User App Play Console account: client account type and any closed testing requirements.
3. Report Issue button on successful compatibility result screen: not confirmed.
4. Basic last-publish restore: implement if feasible; otherwise defer explicitly.
5. Advanced typo tolerance: ensure budget supports it; partial search is minimum fallback.
6. Final package IDs, domain, OAuth client IDs and alert email.
