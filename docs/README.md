# MobiMatch — Coding Agent Documentation

**Status:** Implementation brief / draft for build  
**Last policy review:** 2026-11-12  
**Project parts:** `backend/`, `mobimatch-admin/`, `mobimatch/`

## Read this first

This documentation is the source of truth for the initial MobiMatch implementation. Read the files in this order:

1. `product/requirements.md`
2. `architecture/system-architecture.md`
3. `architecture/decisions.md`
4. `backend/data-model.md`
5. `backend/api-contract.md`
6. `backend/security.md`
7. `apps/user-app.md`
8. `apps/admin-app.md`
9. `release/google-play.md`
10. `quality/testing.md`
11. `delivery/phase-plan.md`

## Required repository layout

The repository must contain three independently buildable deployables:

```text
/backend             # One shared API, PostgreSQL access, Redis, migrations
/mobimatch-admin     # Separate Android administrator app
/mobimatch           # Android end-user app
/docs                # This documentation
```

A monorepo is recommended. Shared TypeScript types and API client code may live in a small `/packages` directory, but do not merge the two Android apps into one application or create separate backend services for them.

## Coding-agent operating rules

- Treat confirmed requirements in these documents as requirements, not suggestions.
- If a requirement is explicitly marked `OPEN`, do not silently invent a product decision. Choose the safest reversible implementation, document the assumption, and ask the project owner before release.
- Do not implement Phase 2 features in the MVP.
- Do not add analytics SDKs, ad SDKs, crash-reporting SDKs, permissions, or third-party services without documenting their data collection and getting approval.
- Do not place secrets, OAuth client secrets, service-account credentials, signing keys, or production environment values in source control or mobile bundles.
- Do not bypass Android security checks, Play Protect, app signing, OAuth verification, or Play policy checks.
- Never claim a build is Play-Store-compliant merely because it compiles. Complete the release checklist and verify current Play Console requirements before submission.
- Build one vertical slice at a time: authentication, model/category data, compatibility search, admin compatibility management, reports, then deployment hardening.
- Keep the UI simple, accessible, phone-first, English-only for MVP, and light-theme by default.
- Add automated tests for parser rules, conflict detection, authorization, account deletion, and compatibility search.

## Important release decision: Admin distribution

The earlier product decision was to distribute `mobimatch-admin` as a private APK. A directly sideloaded APK can cause Android's “install unknown apps” warning and can be scanned by Play Protect. This is normal Android security behaviour. The app must not attempt to suppress or evade it.

If the requirement is to avoid the sideloading warning for administrators, distribute the Admin App through a Play-managed route (for example, an appropriate Play testing track or Managed Google Play private distribution where the client has a suitable managed organization). If the client insists on direct APK delivery, disclose that Android may show its standard install warning. See `release/google-play.md`.

## Budget guardrail

Agreed development fee: **₹8,000**. This is a very constrained budget for two Android apps plus a backend. Deliver the narrow core MVP only. Hosting, domain, Google Play account fees, third-party services, and ongoing operations are client-paid. Do not silently expand scope. See `delivery/phase-plan.md`.
