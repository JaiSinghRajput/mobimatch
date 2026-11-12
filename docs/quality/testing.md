# Quality and Testing Plan

## 1. Test layers

- Unit tests for normalization, parser, conflict detection and validation.
- API integration tests against a disposable PostgreSQL database.
- Authorization tests for user/admin boundaries.
- Mobile component/screen tests for core flows.
- End-to-end smoke tests on Android emulator and at least one physical device.
- Release build smoke tests (not debug-only testing).

## 2. Parser test cases

Must cover:

1. Multiple valid lines.
2. Whitespace around names and separators.
3. Blank lines.
4. Empty token (`Model A == Model B`).
5. Duplicate model on same line.
6. Unknown model.
7. Unknown brand.
8. Ambiguous model name across brands.
9. Cross-brand valid group.
10. Existing group overlap in same category.
11. Explicit merge choice.
12. Cancel conflict.
13. Failed publish rolls back all writes.
14. Successful publish invalidates affected Redis keys.

Never silently guess brand when model matching is ambiguous.

## 3. Search tests

- Exact brand/model match.
- Partial prefix and substring match.
- Typo-tolerant match within bounded relevance threshold.
- Optional model number match.
- Duplicate model numbers return brand/model context.
- Inactive brand/model/category hidden.
- Search result pagination/limit.
- Empty and too-short query handling.
- Search rate limit.

## 4. Compatibility tests

- Model-first flow.
- Category-first flow.
- Result includes selected model.
- Cross-brand models display correctly.
- Result count equals displayed active model count.
- Inactive model is hidden but relationship remains.
- Deactivated category hides results but preserves data.
- No group returns the exact no-result state.
- Redis invalidation after edits.
- Redis outage falls back safely to PostgreSQL.

## 5. Auth and security tests

- Google token with invalid signature/audience/expiry rejected.
- Existing Google `sub` maps to same account.
- Client cannot submit arbitrary role/admin status.
- Normal user receives 403 on admin endpoints.
- Admin allowlist removal blocks next admin request.
- Deactivated user blocked.
- Logout current device revokes session.
- Logout-all revokes all refresh sessions.
- Deleted account sessions revoked.
- User cannot access another user's reports/profile.
- Rate limiting and input size limits work.

## 6. Account deletion tests

- In-app deletion path available.
- Public web deletion resource reachable without sign-in.
- Request is authenticated/verified appropriately before deletion.
- Profile personal data removed or irreversibly anonymized as disclosed.
- Reports/model requests are deleted or anonymized under documented retention rules.
- Shared compatibility catalog is not accidentally deleted.
- Sessions revoked immediately.
- Backup retention/deletion statement matches implementation.

## 7. Android device tests

At minimum:

- Android 10 device/emulator (API 29).
- Current Android release device/emulator.
- Small phone screen and a typical phone screen.
- Network unavailable/restored.
- Backend maintenance mode.
- App update required.
- Google sign-in cancellation/failure/success.
- Clipboard copy.
- APK/AAB release signing and install/update path.

## 8. Release gates

Do not mark MVP complete until:

- No critical crash in main flows.
- No user/admin authorization bypass.
- Parser never partially publishes.
- No critical data-loss defect.
- Privacy and account deletion flow tested.
- Production backup and restore tested.
- Release artifacts signed and versioned.
- Play Console checklist completed for User App.
