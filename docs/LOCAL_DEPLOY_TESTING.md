# Local Deployment Testing

This document describes how to test the `/deploy` endpoint locally without using Docker containers or remote sandboxes.

## Setup

### 1. Environment Configuration

The local deployment mode is controlled by environment variables in `.env.local`:

```bash
# Enable local deployment testing mode
LOCAL_DEPLOYMENT_MODE=true

# Path to your local Flutter app for testing
LOCAL_EXPO_APP_PATH=/Users/rofi/Programing/open-mobile-code/local-expo-app

# Local project ID for testing
LOCAL_PROJECT_ID=local-test-project
```

### 2. Local Expo App

The `local-expo-app/` directory contains a sample Flutter application for testing deployments. It includes:

- Standard go_router setup
- Web build capabilities
- Build scripts configured in `package.json`

## How It Works

When `LOCAL_DEPLOYMENT_MODE=true`, the `/api/deploy/[projectId]` endpoint:

1. **Skips sandbox creation** - Instead of using E2B/Docker, it runs commands locally
2. **Uses local app directory** - Builds the app in `local-expo-app/` folder
3. **Runs build commands directly** - Uses Node.js child processes instead of sandbox commands
4. **Uses the same build script** - Leverages `sandbox-templates/expo-template/build-web.js`

### Web Builds
- Installs dependencies with `npm install`
- Runs the build using the optimized build script
- Creates output in `local-expo-app/dist/`

### Native Builds (iOS/Android)
- Simulates the build process (doesn't require EAS credentials)
- Returns success status for testing API flow
- Real native builds would still require proper EAS setup

## Testing

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Run the Test Script

```bash
# From the root directory - uses default project ID
node test-local-deploy.js

# Test with a specific project ID (useful for sandbox projects)
node test-local-deploy.js my-sandbox-project-id

# Using flag syntax
node test-local-deploy.js --project-id abc123-def456
node test-local-deploy.js -p my-project

# Or from local-expo-app directory
npm run test:deploy

# Show help
node test-local-deploy.js --help
```

### 3. Manual API Testing

You can also test the endpoint directly with curl:

```bash
curl -X POST http://localhost:3210/api/deploy/local-test-project \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "web",
    "action": "build",
    "profile": "preview"
  }'
```

## Expected Output

Successful web build response:
```json
{
  "success": true,
  "message": "Successfully processed build for web (local mode)",
  "results": {
    "projectId": "local-test-project",
    "platform": "web",
    "action": "build",
    "profile": "preview",
    "isLocal": true,
    "steps": [
      {
        "step": "install-deps",
        "success": true,
        "message": "Dependencies installed successfully"
      },
      {
        "step": "web-build",
        "success": true,
        "message": "Web build completed successfully"
      },
      {
        "step": "web-deploy-ready",
        "success": true,
        "message": "Local web build is ready for deployment",
        "buildPath": "/path/to/local-expo-app/dist"
      }
    ]
  }
}
```

## Switching Modes

To switch back to sandbox mode, simply set:
```bash
LOCAL_DEPLOYMENT_MODE=false
```

Or remove the variable entirely. The endpoint will then require `sandboxId` and use the original E2B sandbox approach.

## Troubleshooting

### Build Failures
- Check that `local-expo-app/` has all dependencies installed
- Ensure Node.js version compatibility with Expo
- Check the build output in the API response for specific errors

### Permission Issues
- Make sure the `LOCAL_EXPO_APP_PATH` is accessible
- Check that the build script has proper permissions

### API Errors
- Verify the development server is running on the correct port
- Check that `LOCAL_DEPLOYMENT_MODE` is set to `"true"` (string, not boolean)
- Ensure the project structure matches the expected paths