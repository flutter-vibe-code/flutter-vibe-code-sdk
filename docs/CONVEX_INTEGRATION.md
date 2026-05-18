# Convex Backend Integration

This document describes how Convex backend functionality has been integrated into Flutter Vibe Code, enabling users to create Flutter/Flutter apps with full backend capabilities.

## Overview

The Convex integration allows users to:
- Provision Convex projects directly from Flutter Vibe Code
- Run Convex dev server in E2B sandboxes alongside Expo
- Generate apps with database, authentication, and real-time features
- Manage backend code through the AI chat interface

## Architecture

### 1. Database Schema

**Tables Added:**
- `convex_project_credentials`: Stores Convex deployment credentials per project
  - `projectId`, `userId`: Links to projects and users
  - `teamSlug`, `projectSlug`: Convex team and project identifiers
  - `deploymentUrl`, `deploymentName`: Deployment endpoints
  - `adminKey`: API key for programmatic access
  - `accessToken`: OAuth token for API calls

**Fields Added to `projects` table:**
- `convexProject`: JSON field storing connection state (connected/connecting/failed)
- `convexDevRunning`: Boolean indicating if `convex dev` is running in sandbox

### 2. Backend Services

**Provisioning Service** (`lib/convex/provisioning.ts`):
- `exchangeOAuthCode()`: Exchanges authorization code for access token
- `createConvexProject()`: Creates new Convex project via API
- `authorizeProjectAccess()`: Gets project deploy key
- `provisionDeployment()`: Provisions dev deployment
- `provisionConvexProject()`: Complete orchestration flow

**Environment Variables** (`lib/convex/env-variables.ts`):
- `queryEnvVariable()`: Read env vars from deployment
- `setEnvVariables()`: Update env vars
- `initializeConvexAuth()`: Generate and set JWT keys for auth

### 3. API Routes

**OAuth Flow:**
- `GET /convex/connect`: Initiates OAuth flow
- `GET /convex/callback`: Handles OAuth callback
- `GET /api/convex/callback`: Exchanges code for token

**Project Management:**
- `POST /api/convex/connect`: Connect project to Convex
- `GET /api/convex/status`: Get connection status
- `POST /api/convex/disconnect`: Disconnect project

**Dev Server Management:**
- `POST /api/convex/dev/start`: Start Convex dev in sandbox
- `POST /api/convex/dev/stop`: Stop Convex dev server

### 4. UI Components

**Components** (`components/convex/`):
- `ConvexConnection.tsx`: Main modal for managing Convex connection
- `ConvexConnectButton.tsx`: Button to initiate OAuth flow
- `ConvexTeamSelector.tsx`: Dropdown for selecting team

**Features:**
- Real-time connection status
- Dev server start/stop controls
- Link to Convex dashboard
- Error handling and retry

### 5. Sandbox Template Integration

**Template Files Added** (`local-expo-app/convex/`):
- `schema.ts`: Example database schema
- `auth.config.ts`: Authentication configuration
- `http.ts`: HTTP routes template
- `tsconfig.json`: TypeScript config for Convex

**Configuration:**
- `convex.json`: Points to convex/ directory
- `.env.local`: Injected with deployment URL and admin key

## Usage Flow

### 1. User Connects Project to Convex

```
1. User clicks "Connect Backend" button in project UI
2. Selects Convex team from dropdown
3. Clicks "Connect to Convex"
4. OAuth flow opens in popup window
5. User authorizes on Convex dashboard
6. OAuth callback receives code
7. API exchanges code for token
8. Creates Convex project via provisioning API
9. Stores credentials in database
10. Updates project state to "connected"
```

### 2. Starting Convex Dev Server

```
1. User clicks "Start Dev Server" in Convex modal
2. API creates .env.local in sandbox with credentials
3. Runs `npx convex dev --once` in sandbox
4. Convex functions become available to app
5. Updates project.convexDevRunning = true
```

### 3. AI Generates Backend Code

```
1. User asks AI to create database functionality
2. AI generates Convex schema/functions
3. AI uses file edit tools to write to convex/ directory
4. Convex dev server auto-deploys changes
5. App can now use the new backend functionality
```

## Environment Variables

Required in `.env.local` or deployment environment:

```bash
# Convex OAuth credentials (from Convex dashboard)
CONVEX_OAUTH_CLIENT_ID=<your-oauth-client-id>
CONVEX_OAUTH_CLIENT_SECRET=<your-oauth-client-secret>

# Optional: Override default Convex API endpoints
PROVISION_HOST=https://api.convex.dev
DASHBOARD_HOST=https://dashboard.convex.dev
```

## Setting Up Convex OAuth App

1. Go to [Convex Dashboard](https://dashboard.convex.dev/)
2. Navigate to Team Settings → OAuth Applications
3. Create new OAuth application
4. Set redirect URI to: `https://your-domain.com/convex/callback`
5. Copy Client ID and Client Secret to environment variables

## Database Migrations

After schema changes, generate and run migrations:

```bash
# Generate migration from schema changes
pnpm run db:generate

# Review the migration file in drizzle/migrations/

# Apply migration to database
pnpm run db:migrate
```

## Testing Locally

1. Set up OAuth app in Convex dashboard
2. Add environment variables to `.env.local`
3. Run database migrations
4. Start dev server: `pnpm run dev:3210`
5. Create a new project
6. Click "Connect Backend" and complete OAuth flow
7. Verify project shows "Connected" status
8. Start Convex dev server
9. Test AI backend code generation

## Files Created/Modified

### New Files (~25 files):
- `lib/convex/types.ts`
- `lib/convex/provisioning.ts`
- `lib/convex/env-variables.ts`
- `app/convex/connect/route.ts`
- `app/convex/callback/route.ts`
- `app/api/convex/callback/route.ts`
- `app/api/convex/connect/route.ts`
- `app/api/convex/status/route.ts`
- `app/api/convex/disconnect/route.ts`
- `app/api/convex/dev/start/route.ts`
- `app/api/convex/dev/stop/route.ts`
- `components/convex/ConvexConnection.tsx`
- `components/convex/ConvexConnectButton.tsx`
- `components/convex/ConvexTeamSelector.tsx`
- `public/icons/convex-icon.svg`
- `local-expo-app/convex/schema.ts`
- `local-expo-app/convex/auth.config.ts`
- `local-expo-app/convex/http.ts`
- `local-expo-app/convex/tsconfig.json`
- `local-expo-app/convex.json`
- `docs/CONVEX_INTEGRATION.md`

### Modified Files:
- `lib/db/schema.ts` - Added Convex tables and fields

## API Reference

### Provisioning APIs

The integration uses Convex's provisioning APIs:

1. **Create Project**: `POST /api/create_project`
   - Creates new Convex project in team
   - Returns project metadata and admin key

2. **Authorize Access**: `POST /api/dashboard/authorize`
   - Gets OAuth-scoped deploy key
   - Required for programmatic access

3. **Provision Deployment**: `POST /api/deployment/provision_and_authorize`
   - Creates dev/prod deployment
   - Returns deployment URL and admin key

For more details, see [Convex Platform APIs](https://docs.convex.dev/platform-apis).

## Troubleshooting

### OAuth fails with "Invalid redirect URI"
- Ensure redirect URI in OAuth app matches exactly: `https://your-domain.com/convex/callback`
- Check for trailing slashes - must match exactly

### Project creation fails with "ProjectQuotaReached"
- Team has reached project limit
- Delete unused projects or upgrade team plan

### Dev server won't start
- Check sandbox has active Convex connection
- Verify `.env.local` file was created in sandbox
- Check sandbox logs for error messages

### Changes not reflecting in app
- Ensure Convex dev server is running
- Check that convex functions are deployed
- Verify app is using correct deployment URL

## Future Enhancements

Potential improvements:
- Fetch user's actual Convex teams via API
- Stream Convex dev logs to UI in real-time
- Add Convex function templates to AI prompts
- Support for Convex Actions and HTTP routes
- Integration with Convex scheduled functions
- Support for multiple deployments (dev/prod)
- Convex Auth provider setup UI

## Security Considerations

- OAuth tokens are stored securely in database
- Admin keys are never exposed to client-side code
- Credentials are scoped per project and user
- OAuth flow uses standard authorization code grant
- No hardcoded API keys in Docker images

## Support

For issues or questions:
- Convex docs: https://docs.convex.dev
- Convex Discord: https://discord.gg/convex
- Flutter Vibe Code issues: https://github.com/your-repo/issues
