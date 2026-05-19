# Convex Backend - User Flow

## How It Works

### 1. User Creates or Opens a Project

When a user creates or opens a project in Flutter Vibe Code, they'll see the project page with the code editor, preview, and chat interface.

### 2. Connect Backend Button

In the **top navigation bar**, next to "Download" and "Publish App", users will see a button:

- **Not Connected**: Shows "Connect Backend" (ghost button with Convex icon)
- **Connected**: Shows "Convex Connected" (ghost button)

### 3. Clicking the Button

When the user clicks the button, a **modal dialog** opens showing:

#### First Time (Not Connected):
```
┌─────────────────────────────────────┐
│  🔶 Convex Backend                  │
│                                     │
│  Connect your project to Convex for │
│  database, auth, and real-time      │
│  features.                          │
│                                     │
│  Status: ⚪ Not Connected           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Convex Team                 │   │
│  │ [Personal Team ▼]           │   │
│  │ Your Convex project will be │   │
│  │ created in this team        │   │
│  └─────────────────────────────┘   │
│                                     │
│  [🔗 Connect to Convex]             │
└─────────────────────────────────────┘
```

#### After Connected:
```
┌─────────────────────────────────────┐
│  🔶 Convex Backend                  │
│                                     │
│  Status: ✅ Connected               │
│                                     │
│  Project: my-awesome-app            │
│  Team: personal                     │
│  Dev Server: ✅ Running / ⚪ Stopped │
│                                     │
│  🔗 Open in Convex Dashboard        │
│                                     │
│  [▶️ Start Dev Server] (if stopped) │
│  [⏸️ Stop Dev Server]  (if running) │
│                                     │
│  [❌ Disconnect]                    │
└─────────────────────────────────────┘
```

### 4. OAuth Flow (When Connecting)

When user clicks "Connect to Convex":

1. **Popup Window Opens**
   - A popup window opens showing Convex dashboard login
   - User logs in with their Convex account (or creates one)
   - User authorizes Flutter Vibe Code to access their Convex team

2. **OAuth Callback**
   - Convex redirects back to Flutter Vibe Code with authorization code
   - Popup closes automatically

3. **Provisioning (Behind the Scenes)**
   - Exchange code for access token
   - Create new Convex project in selected team
   - Get deployment credentials
   - Store credentials in database
   - Update UI to show "Connected"

4. **Success!**
   - Modal updates to show connection details
   - User can now start the Convex dev server

### 5. Starting Dev Server

Once connected, user clicks "Start Dev Server":

1. **API Call**
   - Creates `.env.local` in sandbox with deployment URL and admin key
   - Runs `npx convex dev --once` in the E2B sandbox

2. **Dev Server Running**
   - Status updates to "Running"
   - Convex functions become available to the app
   - Changes to `convex/` directory auto-deploy

### 6. Using Convex in AI Chat

Now users can ask the AI to create backend features:

**Example Prompts:**
- "Add a messages database table"
- "Create a function to save user messages"
- "Add authentication with Google"
- "Make the app real-time with subscriptions"

**What Happens:**
1. AI generates Convex code (schema, functions, etc.)
2. AI writes files to `convex/` directory
3. Convex dev server detects changes and auto-deploys
4. App can immediately use the new backend features

### 7. Viewing in Convex Dashboard

Users can click "Open in Convex Dashboard" to:
- View database tables and data
- See function logs
- Manage environment variables
- Check deployment status
- View API usage

## Visual Flow Diagram

```
┌─────────────┐
│ User Opens  │
│  Project    │
└──────┬──────┘
       │
       v
┌─────────────────────────────────┐
│  Top Nav Bar Shows:             │
│  [Download] [Publish] [Connect  │
│                       Backend]  │
└──────┬──────────────────────────┘
       │ (Click)
       v
┌─────────────────────────────────┐
│  Modal Opens:                   │
│  - Select Team                  │
│  - Connect Button               │
└──────┬──────────────────────────┘
       │ (Click Connect)
       v
┌─────────────────────────────────┐
│  OAuth Popup:                   │
│  - Login to Convex              │
│  - Authorize Access             │
└──────┬──────────────────────────┘
       │ (Authorize)
       v
┌─────────────────────────────────┐
│  Provisioning:                  │
│  - Create Convex Project        │
│  - Get Credentials              │
│  - Store in Database            │
└──────┬──────────────────────────┘
       │
       v
┌─────────────────────────────────┐
│  Connected!                     │
│  - Start Dev Server             │
│  - Ask AI to Add Backend        │
└─────────────────────────────────┘
```

## FAQ

### Do users need a Convex account?
- Yes, but they can create one during the OAuth flow
- It's free to start

### Can users use existing Convex projects?
- Currently no - the integration creates new projects
- Future enhancement: allow connecting to existing projects

### What happens if OAuth fails?
- Modal shows error message
- User can retry
- Common issues: wrong team selected, quota reached

### Can users have multiple projects with Convex?
- Yes! Each FlutterVibe project can have its own Convex backend
- They're independent deployments

### Where is backend code stored?
- In the E2B sandbox at `/home/user/app/convex/`
- Synced to user's project in real-time
- Persisted across sandbox restarts

### Can users export/download Convex code?
- Yes! The "Download" button exports everything including `convex/` folder
- Users own their Convex projects

## Integration Points

### For Developers Adding Features:

The Convex integration is now available in:
- `components/nav-header.tsx` - Button in toolbar
- `components/convex/ConvexConnection.tsx` - Main modal
- `app/api/convex/*` - Backend API routes
- `lib/convex/*` - Provisioning services

To add Convex-specific AI tools or prompts, check:
- `app/api/chat/route.ts` - Where AI chat logic lives
- `lib/convex/env-variables.ts` - For programmatic Convex access

## Next Steps

After setup:
1. Add Convex OAuth credentials to `.env.local`
2. Run database migration: `pnpm run db:migrate`
3. Test the flow:
   - Create project
   - Click "Connect Backend"
   - Complete OAuth
   - Start dev server
   - Ask AI to create database features
