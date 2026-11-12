# MobiMatch Android Release & Build Guide

This guide describes how to sign, build, and publish the User App (`mobimatch`) and Administrator App (`mobimatch-admin`) for Android 10+ (API 29+) with Google Play target API 36 compliance.

---

## 1. Release Keystore Generation

Generate stable upload signing keys. **Never commit `.keystore` files or passwords to version control.**

### User App Keystore
```bash
keytool -genkey -v -keystore mobimatch-release.keystore \
  -alias mobimatch \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=MobiMatch, OU=Mobile, O=MobiMatch, C=IN"
```

### Admin App Keystore
```bash
keytool -genkey -v -keystore mobimatch-admin-release.keystore \
  -alias mobimatch-admin \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=MobiMatch Admin, OU=Mobile, O=MobiMatch, C=IN"
```

---

## 2. Extracting SHA-1 Fingerprints for Google OAuth

To allow Google Sign-In to succeed in production, register the SHA-1 and SHA-256 certificate fingerprints in **Google Cloud Console &rarr; APIs & Services &rarr; Credentials &rarr; Create OAuth client ID &rarr; Android**:

```bash
keytool -list -v -keystore mobimatch-release.keystore -alias mobimatch
keytool -list -v -keystore mobimatch-admin-release.keystore -alias mobimatch-admin
```

Copy the `SHA1:` and `SHA256:` hexadecimal strings. When using **Google Play App Signing**, also copy the Play App Signing certificate fingerprint from Play Console into Google Cloud Console.

---

## 3. Building Release Bundles

### Option A: Using EAS Build (Recommended for Expo)
Install EAS CLI and log in:
```bash
npm install -g eas-cli
eas login
```

Configure build profiles in each app:
```bash
# Build User App Android App Bundle (.aab)
cd mobimatch
eas build --platform android --profile production

# Build Admin App APK or AAB
cd ../mobimatch-admin
eas build --platform android --profile production
```

### Option B: Local Native Prebuild & Gradle Build
```bash
# In mobimatch directory
cd mobimatch
npx expo prebuild --platform android
cd android
./gradlew bundleRelease

# Output AAB location:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 4. Google Play Store Listing & Data Safety Answers

When completing the Google Play Console Data Safety questionnaire for `mobimatch`:

| Question / Section | Declaration | Purpose |
|---|---|---|
| **Does your app collect or share data?** | **Yes** | Profile & authentication |
| **Personal Info &rarr; Name** | Collected (optional to display) | App functionality / Account |
| **Personal Info &rarr; Email address** | Collected (verified Google email) | App functionality / Account identity |
| **Personal Info &rarr; Phone number** | Collected (user-entered workshop phone) | App functionality / Account contact |
| **Financial / Health / Contacts / SMS** | **No** (None collected) | N/A |
| **Location data** | **No** (None collected) | N/A |
| **Photos and Videos / Audio / Files** | **No** (None collected) | N/A |
| **Is data encrypted in transit?** | **Yes** (HTTPS/TLS) | Security |
| **Can users request account deletion?** | **Yes** (In-app + Public URL) | Policy compliance |
| **Deletion URL** | `https://<your-domain>/account-deletion` | Direct public link |
| **Privacy Policy URL** | `https://<your-domain>/privacy` | Direct public link |

---

## 5. Admin App Distribution Options

1. **Closed Testing Track (Recommended for zero sideload warnings)**:
   - Upload `mobimatch-admin` to a dedicated Play Console closed testing track.
   - Invite administrator Google accounts via email list.
   - Administrators install via Google Play without unknown-source security prompts.

2. **Direct Signed APK**:
   - Deliver the signed APK directly.
   - Disclose to administrators that Android displays its standard "install unknown apps" prompt. App code does not attempt to bypass this.
