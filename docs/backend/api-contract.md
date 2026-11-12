# Backend API Contract (MVP)

Base path: `/v1`  
Transport: HTTPS JSON.  
All authenticated endpoints require a backend-issued bearer access token. Admin endpoints additionally require a current admin allowlist check.

## 1. Common conventions

- UUID IDs.
- ISO-8601 UTC timestamps.
- Validate request bodies, query params and path params.
- Use consistent errors: `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`.
- Paginate admin lists using cursor or bounded page/limit.
- Never return internal stack traces or database details.
- Apply rate limits by IP and authenticated account as appropriate.

## 2. Health and app configuration

- `GET /health/live` — process liveness; no secrets.
- `GET /health/ready` — DB/cache readiness with sanitized status.
- `GET /app-config` — maintenance status, maintenance message, minimum supported app versions, latest app versions and update URL where applicable.

## 3. Authentication and sessions

- `POST /auth/google` — exchange verified Google ID token for app session; body includes `idToken` and `clientApp` (`user` or `admin`).
- `POST /auth/refresh` — rotate refresh token.
- `POST /auth/logout` — revoke current session.
- `POST /auth/logout-all` — revoke all sessions for current user.
- `GET /auth/me` — current account/profile and effective permissions.

Backend verifies Google ID token. Do not accept email, Google subject or role as trusted body fields.

## 4. User profile and deletion

- `GET /users/me` — profile.
- `PATCH /users/me` — update phone, shop name, city only.
- `DELETE /users/me` — initiate/execute account deletion with explicit confirmation and reauthentication if required by security policy.

Public account deletion resource must also be available outside the app, e.g. `https://<client-domain>/account-deletion`. The exact domain is OPEN until client supplies it. The resource must explain/request deletion and be publicly accessible.

## 5. Public catalog/search

- `GET /brands` — active brands, alphabetical.
- `GET /brands/:brandId/models` — active models for brand, alphabetical.
- `GET /categories` — active categories, alphabetical.
- `GET /models/search?q=...` — suggestions; matches brand, model name and optional model number; bounded results.
- `GET /models/:modelId` — active model detail.
- `GET /compatibility?modelId=...&categoryId=...` — active group and all active member models; includes selected model and count.

Search must be debounced in app. Backend should enforce sensible minimum query length and rate limit. Use PostgreSQL trigram/full-text or another measured implementation; avoid adding a separate search engine in MVP.

## 6. User reports and requests

- `POST /reports` — create compatibility issue report.
- `GET /reports/mine` — optional if user report history is included; OPEN whether the user needs to view past reports. Do not implement unless confirmed.
- `POST /model-requests` — create missing-model request.

## 7. Admin catalog management

All routes below require current admin authorization.

- `GET /admin/brands`
- `POST /admin/brands`
- `PATCH /admin/brands/:id`
- `POST /admin/brands/:id/deactivate`
- `POST /admin/brands/:id/reactivate`
- `GET /admin/models`
- `POST /admin/models`
- `PATCH /admin/models/:id`
- `POST /admin/models/:id/deactivate`
- `POST /admin/models/:id/reactivate`
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:id`
- `POST /admin/categories/:id/deactivate`
- `POST /admin/categories/:id/reactivate`

No hard-delete endpoint in normal MVP admin workflows.

## 8. Admin compatibility

- `GET /admin/compatibility?categoryId=...&modelId=...`
- `POST /admin/compatibility/parse-preview` — parse multiline text; returns groups, matched models, missing candidates, ambiguity and conflicts. Must not write data.
- `POST /admin/compatibility/publish` — accepts preview resolution plus explicit conflict choices; executes one transaction.
- `POST /admin/compatibility/groups` — manual group create.
- `PATCH /admin/compatibility/groups/:id` — edit group.
- `POST /admin/compatibility/groups/:id/deactivate`
- `POST /admin/compatibility/restore-last-publish` — only if restore is implemented; otherwise omit.

A preview response should include a short-lived `previewId` or signed payload so the backend can bind publish to exactly what was reviewed. Revalidate all inputs and conflicts during publish; do not trust client preview data.

## 9. Admin users/reports/requests/allowlist

- `GET /admin/users`
- `GET /admin/users/:id`
- `POST /admin/users/:id/deactivate`
- `POST /admin/users/:id/reactivate`
- `GET /admin/reports`
- `PATCH /admin/reports/:id/status`
- `GET /admin/model-requests`
- `PATCH /admin/model-requests/:id/status`
- `GET /admin/admins`
- `POST /admin/admins` — add allowlisted email.
- `DELETE /admin/admins/:id` — remove allowlisted email; block removal of the final admin unless a safe replacement is added in the same controlled flow.

## 10. Cache rules

Cache only public read responses. Do not cache auth, profile, report, request, admin list or allowlist responses in shared Redis keys. Invalidate relevant catalog and compatibility cache keys after committed mutations.
