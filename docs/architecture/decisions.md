# Architecture Decision Record (ADR) Summary

These are the working decisions for the coding agent. Items marked OPEN require owner confirmation before release.

| ID | Decision | Status |
|---|---|---|
| D-001 | Three project parts: one combined backend, `mobimatch-admin`, `mobimatch` | Confirmed |
| D-002 | One shared API and PostgreSQL database | Confirmed |
| D-003 | PostgreSQL is source of truth; Redis is backend cache only | Confirmed |
| D-004 | Online-only; no client offline compatibility cache | Confirmed |
| D-005 | Android phones, minimum Android 10 / API 29 | Confirmed |
| D-006 | New Google Play submissions target API 36 or current required API | Policy-driven |
| D-007 | User auth through Google; phone number not OTP-verified | Confirmed |
| D-008 | Multiple simultaneous devices and logout-all-devices | Confirmed |
| D-009 | Admin access through verified Google identity allowlist | Confirmed |
| D-010 | Multiple equal-permission admins; removal revokes admin access immediately | Confirmed |
| D-011 | Brand/model/category deactivation is soft; relationships preserved | Confirmed |
| D-012 | Search supports brand/model/model number, partial match and typo tolerance | Confirmed |
| D-013 | Brands, models, categories displayed alphabetically | Confirmed |
| D-014 | Model number optional and may duplicate across models | Confirmed |
| D-015 | Compatibility group uses `=` separators, one group per input line | Confirmed |
| D-016 | Parser preview and admin confirmation before publish | Confirmed |
| D-017 | Conflict is explicit merge or cancel; never silently merge | Confirmed |
| D-018 | User can submit compatibility issue and missing-model request | Confirmed |
| D-019 | User can delete account; external web deletion resource also required by Play policy | Confirmed + policy requirement |
| D-020 | User App public Play distribution planned; client owns Play account decision | Open operational detail |
| D-021 | Admin app initially requested as private APK | Confirmed earlier, but conflicts with no-install-warning goal |
| D-022 | Avoid sideload warning: use Play-managed distribution for Admin App if warning-free install is required | Recommended change; client decision required |
| D-023 | Ads, detailed analytics, announcements, WhatsApp support are Phase 2 | Confirmed |
| D-024 | No share button; Copy List only | Confirmed |
| D-025 | Result screen Report Issue action | OPEN; no answer received |
| D-026 | Basic restore of last compatibility publish | Feasibility gate: Atomic transactional rollback implemented; snapshot history deferred to Phase 2 |
| D-027 | Stack: React Native/Expo + Node/TypeScript/Fastify + PostgreSQL (Drizzle) + Redis | Confirmed & Implemented |
| D-028 | ₹8,000 development fee; keep MVP narrow | Confirmed |
| D-029 | Dev/Test Mock Auth: mock tokens when DEV_MOCK_AUTH=true; official Google ID verification in production | Confirmed & Implemented |
| D-030 | Public Account Deletion web page hosted at /account-deletion for Google Play compliance | Confirmed & Implemented |

## Important clarification: Android 10 support vs Play target API

`minSdkVersion=29` means the app can run on Android 10 and newer. It does **not** mean `targetSdkVersion=29`. For new Google Play submissions on 2026-11-12, target API 36 or higher is required. Keep these settings distinct.

## Important clarification: no-warning installation

There is no legitimate way for an app developer to guarantee Android will never show a security check. Play Protect may scan apps, and direct APK sideloading can show an unknown-source warning. Do not suppress or bypass these controls. Choose a Play-managed distribution path if avoiding sideload warnings is important.
