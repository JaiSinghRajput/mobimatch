# Android Release, Google Play and Installation Safety

**Policy check date:** 2026-11-12. Policies can change; re-check Play Console Help before every release.

## 1. No-warning guarantee is not possible

No developer can guarantee that Android or Google Play Protect will never run a security check or display a warning. Android and Play Protect control these checks. Do not attempt to suppress, bypass, disable or evade them.

A directly downloaded private APK can trigger Android's “install unknown apps” / unknown-source installation warning. This is expected behaviour for sideloading, not proof that the app is malicious.

**If avoiding the sideload warning is important, do not distribute the Admin App as a raw APK download. Use a Play-managed distribution route.**

## 2. Recommended distribution options

### User App (`mobimatch`)

- Publish through the client's Google Play Console account.
- Upload Android App Bundle (`.aab`) for Play distribution.
- Enable Play App Signing.
- Use internal testing first, then closed testing/production as required by the account type.
- Store listing, Data safety, privacy policy, app access and content rating must be completed accurately.

### Admin App (`mobimatch-admin`)

Preferred order if sideload warnings must be avoided:

1. **Play-managed private distribution** through Managed Google Play, if the client has a suitable managed organization and wants organization-restricted distribution.
2. **Play Console internal/closed testing track** if the app should only be available to invited administrators/testers through Google Play. This still requires a Play Console developer account and is not the same as a permanently private managed app.
3. **Direct signed APK** only if the client accepts standard Android sideload warnings and Play Protect scanning.

The previous product choice was private APK distribution. That choice conflicts with the new goal of avoiding sideload warnings. The client must choose one distribution path before release.

## 3. Target/minimum Android versions

As checked on 2026-11-12, Google Play requires new apps and app updates submitted from 2026-08-31 to target Android 16 / API 36 or higher (subject to policy exceptions and changes).

MobiMatch's agreed minimum supported OS is Android 10 / API 29. Configure separately:

- `minSdkVersion = 29` (minimum OS support).
- `targetSdkVersion = 36` or higher if Play policy has advanced by submission time.
- Compile SDK should be current and compatible with build tools.

Do not set target SDK to 29 merely because Android 10 is the minimum supported version.

Official source: https://support.google.com/googleplay/android-developer/answer/11926878

## 4. Signing and build artifacts

- Use release signing, not debug signing.
- User App Play release: AAB + Play App Signing.
- Keep upload keystore and passwords outside source control; limit access and back them up securely.
- For direct Admin APK (if selected), sign with a dedicated stable release key; retain key securely because future updates must use compatible signing identity.
- Do not modify an APK after signing.
- Verify package ID, versionCode, versionName, signature and artifact hash for each release.
- Register correct signing certificate fingerprints with Google OAuth/API providers. With Play App Signing, register the Play app-signing certificate where required, not only the local upload certificate.

Official source: https://support.google.com/googleplay/android-developer/answer/9842756

## 5. New personal Play Console account testing

For personal developer accounts created after 2023-11-13, Google currently requires a closed test with at least 12 testers opted in continuously for at least 14 days before applying for production access. This requirement may not apply identically to organization accounts; verify the client's account type in Play Console.

Official source: https://support.google.com/googleplay/android-developer/answer/14151465

## 6. Privacy policy and Data safety

Before release:

- Host a publicly accessible, non-geofenced privacy policy URL (not a PDF).
- Link it in Play Console and inside the app.
- Identify MobiMatch and the responsible developer/business contact.
- Disclose data collected: verified Google identity/email/name, phone, shop name, city, issue reports, missing-model requests, authentication/session data and any SDK data actually collected.
- Explain purposes, sharing with infrastructure/service providers, retention and deletion.
- Complete Data safety form accurately based on the shipped app and every SDK.
- Do not claim “no data collected” if account/profile data is sent to backend.

Official source: https://support.google.com/googleplay/android-developer/answer/10144311

## 7. Account deletion requirement

Because users can create an account in the app, Google Play requires:

- An in-app path to request/delete the account and associated data.
- A public web resource where users can request account and associated data deletion.
- Accurate answers in the Play Console Data deletion section.
- Clear retention/deletion policy.

Host a simple public page such as `https://<client-domain>/account-deletion`. This is a policy-required informational/request page, not an admin web panel. It must be accessible without signing in. The actual backend deletion workflow must remove or irreversibly anonymize applicable user data as described in the privacy policy.

Official source: https://support.google.com/googleplay/android-developer/answer/13327111

## 8. Permissions and Play Protect hygiene

MVP should need only internet/network-related normal permissions. Do not request:

- SMS or call log permissions.
- Contacts.
- Location.
- Microphone or camera.
- Accessibility service.
- Draw-over-other-apps.
- Install packages.
- Broad file/media access.
- Device admin privileges.

Do not add code obfuscation or dynamic code loading for concealment. Normal production optimization is acceptable, but avoid downloading executable code at runtime. Keep dependencies current and sourced from reputable repositories. Do not use repackaged APKs, unknown SDKs, or hidden behaviours.

Play Protect scans apps and may still perform checks. A clean scan cannot be guaranteed by application code.

## 9. Store listing and review readiness

- Accurate app title, short description, full description, screenshots and icon.
- No misleading claims about compatibility accuracy; describe compatibility data as administrator-maintained.
- Provide reviewer credentials/instructions if app access is restricted, using Play Console's app access section and a controlled review account/process.
- Ensure the app is usable and not a placeholder or broken thin wrapper.
- Complete content rating, target audience, ads declaration (MVP has no ads), Data safety, privacy policy and app access declarations.
- Do not include Phase 2 AdMob/custom ad SDKs until ads are actually implemented and declarations updated.

## 10. Pre-release checklist

- [ ] Current target API requirement rechecked.
- [ ] `minSdkVersion` 29 and target API independently configured.
- [ ] Release build signed with stable key.
- [ ] No secrets/debug endpoints/test admin accounts in bundle.
- [ ] Only required permissions present.
- [ ] Privacy policy publicly accessible and in-app.
- [ ] Account deletion in-app and public web link work.
- [ ] Data safety form reflects actual data and SDK behaviour.
- [ ] App tested on Android 10 and current Android version.
- [ ] Play internal/closed test completed as required.
- [ ] Admin distribution path chosen and its installation warning trade-off accepted.
- [ ] Play Console declarations/store listing completed by account owner.
