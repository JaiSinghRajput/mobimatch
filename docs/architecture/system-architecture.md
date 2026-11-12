# System Architecture

## 1. Topology

```text
┌──────────────────────┐       HTTPS        ┌──────────────────────────┐
│ mobimatch             │ ─────────────────▶ │                          │
│ Android user app      │                    │                          │
└──────────────────────┘                    │  Shared backend API      │
                                            │  (modular monolith)      │
┌──────────────────────┐       HTTPS        │                          │
│ mobimatch-admin       │ ─────────────────▶ │  Auth / Users / Admin    │
│ Android admin app    │                    │  Catalog / Compatibility │
└──────────────────────┘                    │  Reports / Requests      │
                                            └────────────┬─────────────┘
                                                         │
                               ┌─────────────────────────┼─────────────────────┐
                               │                         │                     │
                         ┌─────▼──────┐            ┌─────▼─────┐        ┌──────▼─────┐
                         │ PostgreSQL │            │   Redis   │        │ Logs/Jobs  │
                         │ source of  │            │ response  │        │ minimal    │
                         │ truth      │            │ cache     │        │ operations │
                         └────────────┘            └───────────┘        └────────────┘
```

## 2. Recommended implementation stack

This is an implementation recommendation, not a client-mandated technology choice:

- Mobile apps: React Native + TypeScript + Expo prebuild / EAS-compatible native Android builds.
- Backend: Node.js + TypeScript + Fastify (or a similarly small, well-supported HTTP framework).
- Database: PostgreSQL.
- ORM/migrations: Drizzle ORM or equivalent migration-first SQL toolkit.
- Validation: Zod or equivalent shared runtime validation.
- Cache: Redis.
- Reverse proxy/TLS: Nginx or Caddy.
- Deployment: Docker Compose on one VPS.

Do not add a web admin panel. Admin management is in the separate Android `mobimatch-admin` app.

## 3. Monorepo layout

```text
/
  backend/
    src/
      modules/
        auth/
        users/
        admins/
        brands/
        models/
        categories/
        compatibility/
        reports/
        model-requests/
        health/
      db/
      cache/
      config/
      server.ts
    migrations/
    tests/
    Dockerfile
  mobimatch/
    app/
    src/
      api/
      auth/
      components/
      features/
      navigation/
      theme/
  mobimatch-admin/
    app/
    src/
      api/
      auth/
      components/
      features/
      navigation/
      theme/
  packages/
    api-contracts/       # Optional shared schemas/types only
  docs/
  docker-compose.yml
  .env.example
```

## 4. Backend architecture

Use one deployable modular monolith, not microservices. Modules should have clear boundaries but share one PostgreSQL database and one API process.

Backend is responsible for:

- Verifying Google identity tokens.
- Issuing and revoking application sessions.
- Resolving user/admin authorization.
- Serving active catalog data and search suggestions.
- Resolving compatibility groups.
- Validating and publishing admin imports transactionally.
- Processing reports and model requests.
- Managing cache invalidation.
- Exposing health and maintenance status.

## 5. Authentication flow

1. App invokes Google sign-in using the supported Google identity flow.
2. App sends Google ID token to `POST /v1/auth/google`.
3. Backend verifies token signature, issuer, audience, expiry and nonce where applicable using Google's supported verification approach.
4. Backend identifies account by verified Google `sub`, not by untrusted client data.
5. Backend creates or loads the account.
6. Backend checks active/deactivated status.
7. Backend checks the admin allowlist when an Admin App session is requested or an admin route is accessed.
8. Backend issues its own short-lived access token and rotating refresh token (or secure equivalent).
9. Refresh tokens are stored hashed server-side and revocable per device/session.

Do not embed a Google OAuth client secret in either Android app. Configure correct Android package names and SHA fingerprints in Google Cloud/Identity configuration.

## 6. Authorization model

- `USER`: normal account access to profile, search, reports and model requests.
- `ADMIN`: computed from the current verified identity's presence in the admin allowlist; all admins have equal rights.
- A user's role must not be set by a mobile request payload.
- Every admin endpoint checks current allowlist membership. If removed, next protected request is denied and refresh/session is revoked.
- User deactivation is checked on every protected user request.

## 7. Database and Redis

PostgreSQL is the sole source of truth. Redis is an optimization only.

Cache only public active catalog/search/compatibility responses. Cache keys must include relevant category/model/version context. Invalidate relevant keys after successful transactions that alter brands, models, categories or compatibility groups.

Never depend on Redis for authorization or durable business data. If Redis is down, serve from PostgreSQL with sensible rate/latency limits.

## 8. Compatibility publish transaction

1. Parse and normalize input.
2. Resolve existing brand/model records.
3. Return missing/ambiguous candidates to the Admin App.
4. Admin confirms proposed brand/model creation.
5. Check overlapping active group membership for the selected category.
6. If conflict exists, require explicit merge or cancel choice.
7. On publish, execute one database transaction: create confirmed records, merge/update memberships, record a minimal publish snapshot/audit reference if feasible, and commit.
8. On any error, rollback all writes.
9. Invalidate affected Redis keys after commit.

No partial publish is allowed.

## 9. Environments and deployment

- Separate development and production databases/secrets.
- Single VPS in production: API + PostgreSQL + Redis + reverse proxy.
- Use Docker Compose with persistent PostgreSQL volume and health checks.
- TLS certificate auto-renewal.
- Bind PostgreSQL and Redis to private Docker network only; do not expose their ports publicly.
- Firewall: expose only HTTPS (and SSH restricted to operator IP/key where possible).
- Keep production `.env` outside git; use `.env.example` with placeholders.
- Daily database backup with seven-day retention; test restore at least once before launch.
- Health endpoints must not reveal secrets or internal infrastructure details.

## 10. Scale and cost

Initial design targets a small user base and a low-cost single VPS. Avoid Kubernetes, microservices, message brokers, multiple databases, and complex observability stacks in MVP. Design module boundaries so later scaling is possible without implementing it now.
