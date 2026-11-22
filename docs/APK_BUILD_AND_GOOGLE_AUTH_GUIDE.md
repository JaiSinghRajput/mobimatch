# MobiMatch APK Build & Google Auth Deployment Guide

This guide provides end-to-end instructions for building release APKs for **MobiMatch** (Technician App) and **MobiMatch Admin**, obtaining the **SHA-1 certificate fingerprint**, and configuring **Google Cloud Console OAuth 2.0 Credentials**.

---

## 1. App Identifiers & Packages

| App | Package Name (`android.package`) | Target SDK | Build Profile |
| :--- | :--- | :--- | :--- |
| **MobiMatch (User/Technician)** | `com.mobimatch.app` | 36 (Android 15 Ready) | `preview` (APK) / `production` (AAB) |
| **MobiMatch Admin** | `com.mobimatch.admin` | 36 (Android 15 Ready) | `preview` (APK) / `production` (AAB) |

---

## 2. Option A: EAS Cloud Build (Recommended — No Local Android SDK Required)

Expo Application Services (EAS) builds production `.apk` files on secure cloud servers without needing to download Android Studio or 25GB of SDKs on Windows.

### Step 1: Install EAS CLI & Log In
Open PowerShell in the project directory:
```powershell
npm install -g eas-cli
npx eas login
```
*(If you don't have an Expo account yet, create a free account at [expo.dev](https://expo.dev)).*

### Step 2: Build the APKs
Run the convenient npm scripts:

- **For Technician App APK:**
  ```powershell
  npm run build:apk:user
  # Equivalent to: cd mobimatch && npx eas build -p android --profile preview
  ```

- **For Admin App APK:**
  ```powershell
  npm run build:apk:admin
  # Equivalent to: cd mobimatch-admin && npx eas build -p android --profile preview
  ```

> [!TIP]
> When prompted: *"Generate a new Android Keystore?"*, select **YES**. EAS will automatically generate a secure 2048-bit RSA keystore. Once the build completes (usually 4-8 minutes), EAS outputs a direct `.apk` download link and QR code to install directly on physical Android phones.

### Step 3: Retrieve SHA-1 & SHA-256 Fingerprints from EAS
Run the credentials command:
```powershell
npm run credentials:user
# or
cd mobimatch && npx eas credentials -p android
```
Select **Keystore: Manage everything related to your signing credentials**.
EAS will display your certificate details:
- **SHA-1 Fingerprint**: `AA:BB:CC:DD:EE:...`
- **SHA-256 Fingerprint**: `11:22:33:44:...`

Copy the **SHA-1** fingerprint for Google Cloud Console setup below.

---

## 3. Option B: Local Keystore & Local Machine Setup (Windows)

If you prefer building locally or keeping the keystore file on your local machine:

### Step 1: Install OpenJDK 17
In Windows PowerShell (Run as Administrator):
```powershell
winget install Microsoft.OpenJDK.17
```
Restart PowerShell so `keytool` and `java` are available in your `$env:PATH`.

### Step 2: Generate Release Keystore & Extract SHA-1
Run the automated generator script in this repository:
```powershell
.\scripts\generate-keystore.ps1
```
This script:
1. Generates `mobimatch-release.keystore` (2048-bit RSA, valid for 25+ years).
2. Automatically prints the **SHA-1** and **SHA-256** fingerprints in the terminal.

To inspect the keystore manually anytime:
```powershell
keytool -list -v -keystore mobimatch-release.keystore -alias mobimatch -storepass mobimatch2026
```

### Step 3: Local APK Compilation
```powershell
cd mobimatch
npx expo prebuild --platform android
cd android
.\gradlew assembleRelease
```
The output APK will be placed at:
`mobimatch/android/app/build/outputs/apk/release/app-release.apk`

---

## 4. Google Cloud Console Configuration (OAuth 2.0 Client IDs)

Google Sign-In on Android requires **two** OAuth 2.0 Client IDs in the same Google Cloud project:

### Client ID 1: Android Client ID (For App Signature Verification)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (e.g. `mobimatch-production`).
3. Navigate to **APIs & Services** > **Credentials**.
4. Click **+ Create Credentials** > **OAuth client ID**.
5. Choose **Application type**: **Android**.
6. Set:
   - **Name**: `MobiMatch Android Client`
   - **Package name**: `com.mobimatch.app`
   - **SHA-1 certificate fingerprint**: *(Paste the SHA-1 obtained in Section 2 or 3)*
7. Click **Create**.
8. *(Repeat with package `com.mobimatch.admin` if Admin app uses Google Auth).*

### Client ID 2: Web Application Client ID (For Backend Token Verification)
1. In **APIs & Services** > **Credentials**, click **+ Create Credentials** > **OAuth client ID**.
2. Choose **Application type**: **Web application**.
3. Set **Name**: `MobiMatch Backend Web Client`.
4. Click **Create**.
5. Copy the generated **Client ID** (e.g., `123456789-xxxx.apps.googleusercontent.com`).
6. Paste this Client ID into your backend environment variable on Render / `.env`:
   ```env
   GOOGLE_CLIENT_ID="123456789-xxxx.apps.googleusercontent.com"
   ```

> [!IMPORTANT]
> The Android app sends its Google ID token to the backend. The backend uses `GOOGLE_CLIENT_ID` (the Web Client ID) to verify Google's cryptographic signature via `google-auth-library`. This two-client architecture is standard Google Identity policy.

---

## 5. Setting Backend API URL for the APK

Before compiling your APK, configure the backend URL that the app connects to:

Create or edit `mobimatch/.env`:
```env
# For production APK pointing to Render backend:
EXPO_PUBLIC_API_URL="https://mobimatch-backend.onrender.com"

# For development on local Wi-Fi:
# EXPO_PUBLIC_API_URL="http://192.168.1.XX:3000"
```
And similarly for `mobimatch-admin/.env`:
```env
EXPO_PUBLIC_API_URL="https://mobimatch-backend.onrender.com"
```

Expo automatically embeds any variables starting with `EXPO_PUBLIC_` into the standalone APK.

---

## 6. Pre-Release Checklist

- [x] **Theme & Typography**: Centralized in [mobimatch/src/theme/index.ts](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/mobimatch/src/theme/index.ts) and [mobimatch-admin/src/theme/index.ts](file:///c:/Users/jaisi/OneDrive/Desktop/MOBIMATCH-APP/mobimatch-admin/src/theme/index.ts).
- [x] **AdMob Test Units**: Initialized with safe Google test IDs to protect your account.
- [x] **Min SDK / Target SDK**: `minSdkVersion=29` (Android 10), `targetSdkVersion=36` (Android 15 ready).
- [x] **Branding**: `Mobimatch by jhankar mobile` and footer `crafted by laughingdev` pointing to `https://laughingdev.com`.
- [x] **Types & Build**: `npm run check:types` and `npm test` passing with 0 errors.
