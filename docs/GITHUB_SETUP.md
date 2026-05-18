# GitHub Integration Setup

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret_key

# App Configuration  
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

Note: The system is configured to work with repositories from the `capsule-this` organization.

## GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `user:email` (Access user email addresses)
   - `read:org` (Read org and team membership)
4. Copy the generated token and add it to `GITHUB_TOKEN`

## Webhook Setup

1. Go to your GitHub repository → Settings → Webhooks
2. Click "Add webhook"
3. Set payload URL to: `https://yourdomain.com/api/webhook/github`
4. Set Content type to: `application/json`
5. Set Secret to the same value as `GITHUB_WEBHOOK_SECRET`
6. Select "Just the push event"
7. Make sure the webhook is Active

## Database Migration

You'll need to add the `githubRepo` field to your projects table. Run this SQL migration:

```sql
ALTER TABLE projects ADD COLUMN github_repo TEXT;
```

Or use Drizzle Kit to generate and run the migration:

```bash
npm run db:generate
npm run db:migrate
```

## How It Works

1. When a sandbox is deleted and resume fails, the system checks for a `githubRepo` field
2. If found, it creates a new sandbox from the `github` template
3. Clones the GitHub repository from `capsule-this` organization into `/home/user/project`
4. Runs `npm install` to install dependencies (if package.json exists)
5. Detects project type (Expo/Flutter vs regular) and starts appropriate server
6. Returns the new preview URL

## Testing

To test the recreation flow:

1. Create a project with a GitHub repository
2. Set the `githubRepo` field in the database for that project to the repository name (e.g., `project-40d2330e-571d-4f7e-a5c5-3a9bac452763`)
3. Delete the sandbox manually (or let it expire)
4. Try to access the project - it should automatically recreate the sandbox from the `capsule-this` organization

## Error Handling

The system will:
- Log detailed error messages for debugging
- Fall back to the normal error flow if GitHub recreation fails
- Return appropriate error messages to the frontend
- Update the database with the new sandbox ID if recreation succeeds