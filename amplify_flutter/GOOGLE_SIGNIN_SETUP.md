# Google Sign-In Configuration Guide

## Issue

Google Sign-In on Android requires a `serverClientId` (OAuth 2.0 Web Client ID) from Google Cloud Console.

## Quick Setup

### 1. Get Your Google Web Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client IDs** section
5. Look for the client with type **"Web application"** (NOT Android or iOS)
6. Copy the **Client ID** (it looks like `xxxxx.apps.googleusercontent.com`)

### 2. Add to .env File

Add this line to your `.env` file:

\`\`\`bash
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
\`\`\`

**Important**: Use the **Web Client ID**, not the Android or iOS client ID!

### 3. Restart the App

After adding the environment variable, restart your Flutter app:

\`\`\`bash
flutter run
\`\`\`

---

## Detailed Google Cloud Console Setup

If you haven't set up OAuth credentials yet:

### Create OAuth 2.0 Credentials

1. **Enable Google Sign-In API**

   - Go to **APIs & Services** → **Library**
   - Search for "Google Sign-In API"
   - Click **Enable**

2. **Configure OAuth Consent Screen**

   - Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: `Connectify`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - No need to add scopes, click **Save and Continue**
   - Add test users if needed
   - Click **Save and Continue**

3. **Create Web Client ID**

   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Connectify Web Client`
   - Authorized redirect URIs: Add your Supabase redirect URI
     - Format: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Click **Create**
   - Copy the **Client ID** (not the Client Secret)

4. **Create Android Client ID** (Optional, for production)
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Android**
   - Name: `Connectify Android`
   - Package name: `com.example.amplify_flutter` (or your actual package)
   - SHA-1 certificate fingerprint: Get from keystore
   - Click **Create**

---

## Troubleshooting

### Error: "serverClientId must be provided on Android"

- Make sure you added `GOOGLE_WEB_CLIENT_ID` to `.env`
- Restart the Flutter app after modifying `.env`
- Verify the `.env` file is being loaded in `main.dart`

### Error: "Sign in failed" or "Invalid client"

- Double-check the Client ID is from the **Web** application type
- Ensure there are no extra spaces in the `.env` file
- Verify the Client ID ends with `.apps.googleusercontent.com`

### SHA-1 Certificate Issues (Production)

Get your SHA-1 fingerprint:
\`\`\`bash

# For debug keystore

keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore

keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias
\`\`\`

---

## Current Implementation

The code now reads the Web Client ID from environment variables:

\`\`\`dart
\_googleSignIn.initialize(
serverClientId: dotenv.env['GOOGLE_WEB_CLIENT_ID'],
);
\`\`\`

This value is loaded from your `.env` file at app startup.
