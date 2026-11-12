# MobiMatch — Mobile Spare-Parts Compatibility Platform

MobiMatch is a specialized compatibility platform helping mobile repair technicians, shop owners, and spare-parts dealers find which phone models share spare-part compatibility groups (LCD displays, flex cables, batteries, etc.). Official compatibility data is maintained centrally by administrators.

---

## Repository Layout

This monorepo contains three independently buildable deployables and shared contracts:

```text
/
├── backend/             # Fastify modular monolith API, PostgreSQL (Drizzle ORM), Redis, Migrations
├── mobimatch/           # Android User App for search, browsing, and compatibility queries
├── mobimatch-admin/     # Standalone Android Administrator App for catalog, bulk parser & allowlist
├── packages/
│   └── api-contracts/   # Shared TypeScript types, Zod schemas, and compatibility parser engine
├── docs/                # Comprehensive technical and policy documentation
├── docker-compose.yml   # Production container composition
└── .env.example         # Environment template
```

---

## Quick Start (Development)

### 1. Prerequisites
- **Node.js**: v20 or higher (v26+ supported)
- **npm**: v10 or higher
- **PostgreSQL**: v14+ (v18 supported)
- **Redis** *(optional in local dev; system automatically falls back safely to PostgreSQL)*

### 2. Install Dependencies
From the repository root:
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL instance (e.g., `postgresql://postgres:password@localhost:5432/mobimatch`).

### 4. Seed Initial Data
Run database migrations and populate core brands, categories, and compatibility groups:
```bash
npm run --workspace=mobimatch-backend db:seed
```

### 5. Run the Backend API
```bash
npm run backend:dev
```
The API starts at `http://localhost:3000` (`http://10.0.2.2:3000` for Android emulators).
- Health check: `http://localhost:3000/health/live`
- App configuration: `http://localhost:3000/v1/app-config`
- Account deletion resource: `http://localhost:3000/account-deletion`
- Privacy policy: `http://localhost:3000/privacy`
- Terms of service: `http://localhost:3000/terms`

### 6. Start the Mobile Apps
In separate terminals:
- **User Android App (`mobimatch`)**:
  ```bash
  npm run user:start
  ```
- **Admin Android App (`mobimatch-admin`)**:
  ```bash
  npm run admin:start
  ```

---

## Automated Testing

Run all unit and integration tests across contracts and backend:
```bash
npm test
```

### Test Coverage Highlights
- **Parser Engine Tests**: Multiple valid lines, blank lines, whitespace trimming, empty token rejection (`A == B`), duplicate token rejection, singleton rejection, and cross-brand parsing.
- **Backend API Integration Tests**: Health probes, Google token verification, mandatory profile completion, session refresh rotation, logout, logout-all, admin allowlist gatekeeper, brand/category/model CRUD with soft deactivation, partial search suggestions, multiline parser preview, conflict detection (merge vs cancel), atomic transactional publish, issue reports, missing model requests, last-admin deletion guardrail, and account deletion.

---

## Database Backups

- **Windows**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File backend/scripts/backup.ps1
  ```
- **Linux / Docker**:
  ```bash
  ./backend/scripts/backup.sh
  ```
Backups retain a 7-day rolling window automatically.

---

## Production Deployment

A single VPS running Docker Compose is sufficient for initial production:
```bash
docker compose up -d --build
```
PostgreSQL and Redis are isolated within a private Docker bridge network and not exposed to the public internet.

---

## Documentation

Full architectural specifications and policies are in [`/docs`](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/docs/README.md):
- [Requirements](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/docs/product/requirements.md)
- [System Architecture](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/docs/architecture/system-architecture.md)
- [Architecture Decisions (ADRs)](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/docs/architecture/decisions.md)
- [API Contract](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/docs/backend/api-contract.md)
- [Google Play & Release Compliance](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/docs/release/google-play.md)
- [Testing & Quality Plan](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/docs/quality/testing.md)
- [Phase Delivery Plan](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/docs/delivery/phase-plan.md)

