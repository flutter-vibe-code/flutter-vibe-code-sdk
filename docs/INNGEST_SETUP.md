# Inngest Setup and Deployment Guide

## Overview
This project uses Inngest to schedule automatic pausing of e2b sandboxes after 25 minutes of activity, preventing them from being deleted at the 30-minute timeout.

## Local Development

### 1. Set up environment variables
Create a `.env.local` file with:
```
INNGEST_EVENT_KEY=test
INNGEST_SIGNING_KEY=test
```

### 2. Start the Inngest Dev Server
Run in a separate terminal:
```bash
npm run inngest:dev
```

This will start the Inngest dev server at http://localhost:8288

### 3. Start your Next.js app
```bash
npm run dev
```

### 4. Register your functions
Visit http://localhost:8288 and you should see your app automatically registered with the pause-container function.

## Production Deployment

### 1. Create an Inngest account
Sign up at https://www.inngest.com

### 2. Get your production keys
- Go to your Inngest dashboard
- Navigate to Settings → Keys
- Copy your Event Key and Signing Key

### 3. Set production environment variables
Add to your production environment (e.g., Vercel):
```
INNGEST_EVENT_KEY=your_production_event_key
INNGEST_SIGNING_KEY=your_production_signing_key
```

### 4. Deploy your application
Deploy your Next.js app as usual. The Inngest integration will be included.

### 5. Sync with Inngest Cloud
After deployment, Inngest will automatically discover your functions at:
```
https://your-domain.com/api/inngest
```

You can manually trigger a sync from the Inngest dashboard if needed.

## How it Works

1. **Container Creation/Resume**: When a container is created or resumed, a pause job is scheduled for 25 minutes later
2. **Automatic Pause**: The scheduled function runs after 25 minutes and pauses the sandbox
3. **Project Access**: When a user accesses a paused project, it automatically resumes and schedules a new pause job

## Testing

To test the pause functionality in development:
1. Create a new container
2. Check the Inngest dev server UI to see the scheduled pause job
3. Wait 25 minutes (or modify the timeout for testing)
4. Verify the container is paused and project status is updated

## Troubleshooting

- **Functions not showing up**: Make sure the Inngest dev server is running and your Next.js app is started
- **Scheduled jobs not running**: Check the Inngest dashboard for any errors
- **Environment variables**: Ensure both INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are set correctly