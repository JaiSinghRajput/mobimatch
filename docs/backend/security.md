# Security Requirements

## 1. Authentication

- Verify Google ID tokens server-side using Google's official verification libraries/endpoints.
- Validate signature, issuer, audience, expiry and nonce/state protections in the mobile OAuth flow.
- Identify Google accounts by verified `sub`; email is an attribute, not the primary identity key.
- Never put OAuth client secrets or service-account credentials in mobile apps.
- Use separate OAuth client configuration for the correct Android package/signing certificate as required.
- Do not log raw ID tokens, access tokens or refresh tokens.

## 2. Application sessions

- Issue app-owned short-lived access tokens and rotating refresh tokens.
- Store refresh token hashes, not raw tokens.
- Rotate refresh token on use and detect reuse where practical.
- Support current-device logout and logout-all-devices.
- Revoke sessions on account deletion/deactivation.
- Admin allowlist removal must immediately block admin API calls, even if a JWT has not expired. Do not rely only on a long-lived `role=admin` claim.

## 3. Authorization

- Deny by default.
- All admin endpoints require server-side admin verification.
- User IDs in request payloads must not determine ownership; derive current user from session.
- Enforce object-level authorization for reports and requests.
- Prevent mass assignment; explicitly allow profile fields `phone`, `shopName`, `city` only.
- Never allow normal users to create/update official brands, models, categories or compatibility groups.

## 4. API protections

- HTTPS only; redirect or reject plain HTTP except local development.
- Rate limit authentication, search, report creation and admin mutations.
- Validate and length-limit every input.
- Use parameterized SQL/ORM query builders.
- Restrict CORS to required origins if any web resources are added.
- Apply request body size limits; parser input should have a documented maximum length/line count.
- Return generic authentication errors that do not leak account existence unnecessarily.
- Avoid verbose production error messages.

## 5. Android application hardening

- Request only required permissions. MVP should need internet access and perhaps normal network state access; do not request SMS, call logs, contacts, location, microphone, camera, accessibility, overlay, package installation, or broad file access.
- Store tokens using Android Keystore-backed secure storage via a maintained library.
- Do not store compatibility data for offline use.
- Disable debug builds and developer menus in release builds.
- Do not include test credentials, sample admin accounts or backend secrets in release artifacts.
- Use official libraries and keep dependencies updated.
- Do not hide the app, evade Play Protect, disable Android security services or use deceptive installation flows.

## 6. Infrastructure

- PostgreSQL and Redis must not be publicly exposed.
- Firewall public access to HTTPS and restricted SSH only.
- Use non-root containers/users where practical.
- Store secrets in server environment/secret manager, not git.
- Backups encrypted at rest where supported; restrict access.
- Rotate credentials after compromise and before production handover if shared during development.
- Log security events without logging sensitive payloads.

## 7. Privacy and data minimization

Expected MVP data: Google subject, name, email, phone, shop name, city, issue reports, missing-model requests, and minimal session metadata.

- No contact list, SMS, call logs, location or advertising ID collection.
- Do not fingerprint devices.
- Do not use search history as a user-facing feature.
- Do not introduce analytics/ad SDKs in MVP.
- Publish an accurate privacy policy and in-app link.
- Complete Play Console Data safety declarations based on the final actual SDK/data flows.
- Provide in-app account deletion and public web deletion request URL.
- Explain data retention/deletion accurately; do not promise deletion if backups/legally required records are retained. Define and disclose backup expiry/deletion behaviour.

## 8. Security acceptance tests

- A normal user cannot call any admin endpoint.
- A removed admin loses admin access on their next request without waiting for access-token expiry.
- A deactivated user cannot access protected routes.
- A refresh token cannot be reused after rotation/revocation.
- User A cannot view or modify User B's profile/reports.
- A client cannot assign itself admin role by changing payload or local storage.
- Malformed parser input cannot partially publish data.
- SQL injection and oversized request attempts are safely rejected.
- Deleted account sessions stop working immediately.
