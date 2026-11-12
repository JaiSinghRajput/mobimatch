# Product Requirements — MobiMatch

**Version:** 1.0  
**Product status:** MVP specification  
**Budget:** ₹8,000 development fee; infrastructure and third-party fees excluded.

## 1. Product summary

MobiMatch helps mobile repair technicians and shop owners find which phone models share a spare-part compatibility group. Official compatibility data is maintained by administrators in one central database.

Example input for one category:

```text
Redmi Note 10 = Redmi Note 10S = Redmi Note 11
Samsung A52 = Samsung A52s
Redmi 9 = Poco M2
```

Each line represents one compatibility group for the category currently selected by the administrator. Model names are separated by `=`. Groups can contain models from different brands.

## 2. Product components

1. **`mobimatch`** — Android user application for search and viewing compatibility.
2. **`mobimatch-admin`** — separate Android app for authorized administrators.
3. **`backend`** — one shared API, PostgreSQL database, Redis cache and deployment configuration.

Both apps call the same API. Authorization is always enforced by the backend.

## 3. Target users

- Mobile repair technicians.
- Mobile repair shop owners.
- Mobile spare-parts dealers.
- Authorized MobiMatch administrators.

## 4. Platforms and baseline

- Android phones only; tablet-specific layouts are not required.
- Minimum supported Android version: Android 10 / API 29 (`minSdkVersion` 29).
- User-facing language: English for MVP. Structure UI strings for future localization.
- Light theme, clean and simple visual design.
- Online-only; no local compatibility database and no offline search.
- Both apps should remain lightweight and request only necessary permissions.
- Google Play submissions must use the currently required target API. As of 2026-11-12, new apps and updates must target Android 16 / API 36 or higher. Keep `minSdkVersion` 29 separate from `targetSdkVersion` 36 (or higher if required at submission time).

## 5. User authentication and profile

### 5.1 Sign-in

- Google sign-in / OAuth.
- Existing Google identity signs in to its existing MobiMatch account; no duplicate account for the same Google subject (`sub`).
- New Google identity creates a user account after profile completion.
- Phone number is collected but is not OTP-verified in MVP.
- Require acceptance of Terms & Conditions and Privacy Policy before completing registration.
- A Google email in the administrator allowlist is eligible for admin access in the Admin App. Other identities must not receive admin access.
- Do not trust a client-supplied email or role. Verify Google ID tokens on the backend and use the verified `sub` as the identity key.

### 5.2 Required user profile fields

| Field | Source | Editable by user |
|---|---|---|
| Name | Google profile | No; Google-managed |
| Email | Verified Google identity | No; Google-managed |
| Phone number | User input | Yes |
| Shop name | User input | Yes |
| City | User input | Yes |

Profile completion is mandatory after first Google sign-in and before access to search.

### 5.3 Sessions and account state

- Multiple devices may remain signed in simultaneously.
- Provide current-device logout and logout-all-devices.
- Sessions remain valid until logout, account deletion, deactivation, or revocation; implement secure refresh-token rotation and server-side revocation.
- Deactivated users cannot sign in to protected app features. Only an administrator can reactivate them.
- User may delete their own account. Also provide a public web account-deletion request URL for Play policy compliance.
- Users cannot change the Google identity linked to an existing account in MVP.

## 6. User app home and navigation

Home is search-focused:

- Prominent global search box.
- Browse Brands.
- Browse Categories.
- Profile/settings access.
- No favorites and no search history.
- Announcements are Phase 2, not MVP.

### 6.1 Model-first flow

1. Search or browse a brand/model.
2. Select a model.
3. Select a spare-part category.
4. Fetch the active compatibility group for that model/category.
5. Display all models in that group, including the searched model.

### 6.2 Category-first flow

1. Select a category.
2. Search or browse a model.
3. Fetch and display its compatibility group.

### 6.3 Browsing and sorting

- Brand list alphabetical A–Z.
- Models within a brand alphabetical A–Z.
- Categories alphabetical A–Z.
- Only active brands, models and categories visible to normal users.
- Admin-configured custom category ordering is not part of MVP.

## 7. Search requirements

Global search matches:

- Brand name.
- Model name.
- Optional model number.

Support partial matching, basic typo tolerance and suggestions while typing. Suggestions display brand and model name; model number may be shown where useful. Search results are text-only; no brand logos.

Duplicate model numbers are allowed. The model number is not a unique identifier. Always show brand and model name to disambiguate.

Search should be debounced on-device and rate-limited on the API. Search must not create a persistent per-user search-history feature. Aggregated metrics are Phase 2.

## 8. Compatibility results

Show:

- Selected category.
- Selected model.
- Every model in the compatibility group, including the selected model.
- Total model count.
- Brand and model name for every entry.
- `Copy List` action.

Copied text includes category and each `Brand — Model` line. No share button, part images, technical specifications or verification badges in MVP.

If no active compatibility group exists, show: **“No compatibility information found.”** The no-result screen includes a Report Issue action.

**OPEN:** A Report Issue action directly on successful result screens was asked as a follow-up but not answered. Do not assume it is required; no-result reporting is confirmed.

## 9. Reports and missing-model requests

### 9.1 Compatibility issue reports

Authenticated users can submit a report with one category:

- Incorrect compatibility.
- Wrong mobile model.
- Missing compatible model.
- Other.

Description is optional. Attach selected model/category/group context where available. Admin can view and update report status (e.g. open, reviewing, resolved, rejected).

### 9.2 Missing mobile model requests

Fields:

- Brand name (required; allow a new brand name suggestion).
- Model name (required).
- Model number (optional).
- Notes (optional).

Admin can approve or reject. Approval does not automatically publish a model; an admin explicitly creates/confirms the brand/model.

Users cannot create/request spare-part categories.

## 10. Admin app

### 10.1 Access

- Separate Android app `mobimatch-admin`.
- Google sign-in.
- Any person may install the app, but only allowlisted Google identities can access admin APIs.
- Multiple admins; equal full permissions.
- Admins can view/add/remove allowlist emails.
- `INITIAL_ADMIN_EMAIL` environment variable bootstraps the first admin on initial deployment only; do not re-add it on every server restart if removed.
- Re-check allowlist status on every admin API request or through a sufficiently short-lived server-validated authorization mechanism. Removal revokes access immediately.
- Removed admin may still use User App if their user account is active.

### 10.2 Admin functions

MVP admin navigation:

- Brands: create/edit/activate/deactivate.
- Models: create/edit/assign brand/add optional model number/activate/deactivate.
- Categories: create/edit/activate/deactivate.
- Compatibility groups: manual management and bulk text parser.
- Users: list/view/deactivate/reactivate.
- Issue reports: list/view/update status.
- Missing-model requests: list/review/approve/reject.
- Admin allowlist: list/add/remove.

### 10.3 Soft deactivation

- Normal delete action is soft deactivation, not hard deletion.
- Deactivated brands/models/categories are hidden from normal user search.
- Existing compatibility relationships are preserved.
- Reactivating a record makes it available again without rebuilding relationships.
- Deactivated category hides its compatibility results but preserves data.

### 10.4 Bulk compatibility parser

Input is multiline text. Each non-empty line is one group. Split models by `=`.

Validation and preview must:

1. Trim whitespace.
2. Reject empty model tokens and lines with fewer than two distinct models (unless manual edit supports a singleton draft; do not publish singleton groups).
3. Reject duplicate model tokens within the same line after normalization.
4. Match existing brand/model records safely.
5. Never guess an ambiguous brand/model match.
6. Identify missing model and brand candidates.
7. Require admin confirmation before creating missing brand/model records.
8. Detect overlapping/conflicting memberships for the same category.
9. Offer explicit merge or cancel when a conflict is detected; never silently merge.
10. Show complete preview before publish.
11. Require one admin confirmation to publish. No second-admin approval workflow.

The first implementation can use deterministic normalization and matching rules; do not build an AI-based fuzzy parser. Search typo tolerance and import identity matching are separate concerns.

### 10.5 Compatibility restore

Provide a basic restore mechanism for the last published compatibility change if feasible. A full unlimited version-history UI is out of MVP scope. At minimum, implement a transactionally safe import so failed publishes never leave partial data. If last-publish rollback cannot fit the agreed budget, surface it as an explicit deferred item rather than faking it.

### 10.6 Admin confirmation

Require a confirmation dialog for important operations such as publish, deactivate user/model/category/brand, and remove admin email.

## 11. Model and category data rules

Model record:

- ID generated by backend.
- Brand ID required.
- Model name required.
- Model number optional.
- Active status.

No separate regional variants, hardware revisions, or per-part variants in MVP. Compatibility differences must be represented by manually curated groups.

Categories are dynamic API data; adding a category must not require a mobile app update.

## 12. Online, maintenance and caching

- Internet required for all search and admin operations.
- No offline cache of compatibility records on client.
- Show a connection-required screen with retry and connectivity recovery.
- Show a distinct maintenance message if backend maintenance mode is enabled.
- Maintenance mode is controlled through server configuration by the developer, not from Admin App.
- PostgreSQL is authoritative; Redis caches eligible public compatibility/search responses only.
- Invalidate affected cache keys on compatibility, model, brand or category mutations.
- Never cache private user profile/admin authorization responses in shared Redis keys.

## 13. Security, backup and operations

- HTTPS only.
- Verify Google ID tokens on backend.
- Server-side authorization for every protected endpoint.
- Rate limiting and request validation.
- No unnecessary Android permissions.
- Daily PostgreSQL backup, seven-day rolling retention.
- Basic uptime monitoring and email outage alert to primary owner.
- Development and production environments are separate.
- Single VPS initially hosts API, PostgreSQL and Redis; client pays hosting and domain.

## 14. Phase 2 — explicitly excluded from MVP

- Google AdMob and admin-managed custom advertisements.
- Detailed analytics dashboard (registered users, active users, popular models/categories, no-result searches, compatibility group popularity, custom ad metrics).
- Announcements.
- WhatsApp support button and admin-editable support number.
- CSV/Excel import.
- Professional branding and logo design.
- Hindi or other translations.
- Advanced compatibility history/rollback.
- Native share feature.

No external advertiser accounts or advertiser portal are planned.

## 15. MVP acceptance criteria

MVP is ready for client testing when:

1. New user can Google sign in, accept legal links, complete profile and reach home.
2. Existing Google identity signs into the same account.
3. Admin access is granted only to allowlisted Google identities.
4. Admin can create/edit/deactivate brands, models and categories.
5. Deactivation preserves compatibility relationships and hides inactive records from users.
6. Admin can create groups manually and import multiple groups from multiline `=` text.
7. Parser preview identifies missing models and conflicts and requires confirmation before publish.
8. Model-first and category-first search work.
9. Partial search and suggestions work for brand/model/model number.
10. Results show all group models, brands, count and copy-list action.
11. No-result screen offers issue reporting.
12. Users can submit issue reports and missing-model requests.
13. Admin can review/resolve reports and approve/reject requests.
14. User can request/delete account in app and through public web resource.
15. Online-required and maintenance states are clear.
16. Core security, backup and deployment checks pass.

## 16. Scope and budget guardrail

The agreed development fee is ₹8,000. This budget is unusually constrained for two Android apps plus a backend. Build only the narrow core MVP, keep UI simple, and avoid optional infrastructure/SDKs. Any feature not realistically achievable within budget must be raised with the client and explicitly deferred or separately quoted. Do not represent Phase 2 as included.
