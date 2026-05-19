# Deployment API Documentation

This document describes the deployment functionality for building and publishing mobile and web applications using EAS (Expo Application Services).

## Prerequisites

- The project must be running in a sandbox with EAS CLI installed
- For native builds (iOS/Android), an Expo account is required
- EAS authentication is handled automatically using stored credentials

## API Endpoints

### 1. EAS Login
**POST** `/api/eas/login`

Authenticate with EAS using stored credentials.

```json
{
  "sandboxId": "your-sandbox-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "EAS login successful",
  "username": "bidah"
}
```

### 2. EAS Build
**POST** `/api/eas/build`

Build your application for specified platforms.

```json
{
  "sandboxId": "your-sandbox-id",
  "projectId": "your-project-id",
  "platform": "ios", // "ios", "android", or "all"
  "profile": "preview" // "development", "preview", or "production"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Build initiated successfully for ios",
  "buildUrls": {
    "ios": "https://expo.dev/builds/your-build-id"
  }
}
```

### 3. EAS Submit
**POST** `/api/eas/submit`

Submit builds to app stores.

```json
{
  "sandboxId": "your-sandbox-id",
  "projectId": "your-project-id",
  "platform": "ios", // "ios" or "android"
  "latest": true // Use latest build, or specify "buildId"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully submitted ios build to App Store Connect",
  "submissionUrl": "https://expo.dev/submissions/your-submission-id"
}
```

### 4. Build Status
**POST** `/api/eas/status`

Check the status of builds or submissions.

```json
{
  "sandboxId": "your-sandbox-id",
  "projectId": "your-project-id",
  "type": "build", // "build" or "submit"
  "platform": "ios", // Optional: filter by platform
  "limit": 10
}
```

### 5. Comprehensive Deploy
**POST** `/api/deploy/{projectId}`

Complete deployment workflow that handles login, build, and optional submission.

```json
{
  "sandboxId": "your-sandbox-id",
  "platform": "web", // "web", "ios", "android", or "all"
  "action": "build", // "build", "submit", or "deploy"
  "profile": "preview",
  "autoSubmit": false // Auto-submit after successful build
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed build for web",
  "results": {
    "projectId": "your-project-id",
    "platform": "web",
    "steps": [
      {
        "step": "web-build",
        "success": true,
        "message": "Web build completed successfully",
        "buildPath": "/home/user/app/dist"
      }
    ]
  }
}
```

## Platform-Specific Notes

### Web Deployment
- Uses `npm run build:web` or falls back to `expo export:web`
- Build output is typically in `/home/user/app/dist`
- Ready for deployment to hosting services like Vercel, Netlify, etc.

### iOS Deployment
- Requires Apple Developer account
- Creates `.ipa` files for distribution
- Can submit directly to App Store Connect with proper credentials

### Android Deployment
- Creates `.apk` or `.aab` files
- Can submit directly to Google Play Console with proper credentials

## Build Profiles

### Development
- Fast builds for testing
- Debug information included
- Not suitable for store distribution

### Preview
- Optimized builds for testing
- Can be shared via Flutter Web or standalone
- Suitable for internal distribution

### Production
- Fully optimized for store distribution
- Minified and obfuscated code
- Required for App Store/Play Store submission

## Error Handling

All endpoints return structured error responses:

```json
{
  "success": false,
  "error": "Description of the error",
  "details": "Additional error details"
}
```

Common error scenarios:
- **401**: EAS authentication required
- **400**: Invalid request parameters
- **500**: Build/deployment failure

## Usage Examples

### Build for iOS Preview
```javascript
const response = await fetch('/api/eas/build', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sandboxId: 'your-sandbox-id',
    projectId: 'your-project-id',
    platform: 'ios',
    profile: 'preview'
  })
});
```

### Complete Web Deployment
```javascript
const response = await fetch('/api/deploy/your-project-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sandboxId: 'your-sandbox-id',
    platform: 'web',
    action: 'deploy'
  })
});
```

### Build and Submit to Store
```javascript
const response = await fetch('/api/deploy/your-project-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sandboxId: 'your-sandbox-id',
    platform: 'ios',
    action: 'submit',
    profile: 'production',
    autoSubmit: true
  })
});
```

## Helper Scripts

The sandbox containers include several helper scripts:

- `node eas-login.js` - Interactive EAS login
- `node build-web.js` - Web build with automatic detection
- `eas build -p ios --non-interactive` - Direct EAS commands

## Monitoring Builds

Use the status endpoint to monitor build progress:

```javascript
// Check recent builds
const status = await fetch('/api/eas/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sandboxId: 'your-sandbox-id',
    projectId: 'your-project-id',
    type: 'build',
    limit: 5
  })
});
```

## Security Notes

- EAS credentials are securely stored and not exposed in responses
- All sandbox operations are isolated per user session
- Build artifacts are only accessible within the sandbox environment