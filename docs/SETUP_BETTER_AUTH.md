# 🚀 Better Auth + Neon Setup Guide

This guide will help you complete the migration from Supabase to Better Auth with Neon Database.

## 📋 Prerequisites

1. **Neon Database Account**: Sign up at [neon.tech](https://neon.tech)
2. **Google OAuth App**: Set up at [Google Cloud Console](https://console.cloud.google.com)

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database - Get from Neon Dashboard
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here-min-32-chars"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3210"

# Existing AI/Chat providers
ANTHROPIC_API_KEY=your_key_here
FIREWORKS_API_KEY=your_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
MISTRAL_API_KEY=your_key_here

# Rate limiting
KV_REST_API_URL=your_url_here
KV_REST_API_TOKEN=your_token_here

# Analytics
POSTHOG_KEY=your_key_here
POSTHOG_HOST=your_host_here
```

## 🗃️ Database Setup

### 1. Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

### 2. Run Database Migration

```bash
# Generate migration files (already done)
npm run db:generate

# Apply migrations to your Neon database
npm run db:migrate

# Optional: Open Drizzle Studio to view your database
npm run db:studio
```

## 🔑 Google OAuth Setup

### 1. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### 2. Configure OAuth Consent Screen

1. Go to "OAuth consent screen"
2. Choose "External" (for public use)
3. Fill in required fields:
   - App name: "Fragments"
   - User support email: your email
   - Developer contact email: your email

## 🚦 Better Auth Secret

Generate a secure secret for Better Auth:

```bash
# Generate a secure 32+ character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🧪 Testing the Setup

1. **Start Development Server**:

   ```bash
   npm run dev
   ```

2. **Test Authentication Flow**:

   - Visit `http://localhost:3000`
   - Try to submit a prompt (should trigger auth modal)
   - Click "Continue with Google"
   - Complete OAuth flow
   - Verify user is signed in

3. **Check Database**:
   ```bash
   npm run db:studio
   ```
   - Verify user data is stored in Neon
   - Check `user`, `session`, `account` tables

## 🎯 Key Features Implemented

✅ **Google OAuth Only** - Simplified, secure authentication
✅ **Neon PostgreSQL** - Serverless, scalable database  
✅ **Better Auth** - Modern, TypeScript-first auth library
✅ **Auto Team Creation** - New users get default team
✅ **Modal Auth Flow** - Prompts authentication when needed
✅ **Session Management** - Persistent login state
✅ **Database Relations** - Users, teams, sessions properly linked

## 🚨 Important Notes

1. **Remove Old Supabase Code**:

   - Delete `lib/supabase.ts`
   - Remove Supabase environment variables
   - Update any remaining Supabase references

2. **Production Deployment**:

   - Update `NEXT_PUBLIC_APP_URL` to your domain
   - Add production OAuth redirect URI
   - Ensure DATABASE_URL uses SSL (`?sslmode=require`)

3. **Analytics**: PostHog tracking is updated for Better Auth users

## 🐛 Troubleshooting

### Authentication Issues

- Check Google OAuth redirect URIs match exactly
- Verify `BETTER_AUTH_SECRET` is set and 32+ characters
- Ensure `DATABASE_URL` is correct and accessible

### Database Issues

- Run `npm run db:migrate` if tables are missing
- Check connection string format
- Verify Neon database is active (not sleeping)

### Session Issues

- Clear browser cookies and localStorage
- Check browser network tab for API errors
- Verify Better Auth API routes are working: `/api/auth/session`

## 🎉 Next Steps

Your app now uses:

- **Better Auth** for authentication
- **Neon PostgreSQL** for data storage
- **Google OAuth** for secure login
- **Modal-based auth flow** for better UX

The authentication system is now more modern, secure, and scalable! 🚀
