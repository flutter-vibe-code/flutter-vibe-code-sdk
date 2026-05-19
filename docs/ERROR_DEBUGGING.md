# Error Debugging Guide

This guide helps you debug and troubleshoot errors that occur during chat stream execution, particularly the "SandboxError: 2: [unknown] terminated" error.

## Overview

We've implemented comprehensive error tracking and logging throughout the application to help diagnose issues when chat streams terminate unexpectedly.

## Error Tracking System

### Enhanced Logging

All errors are now logged with detailed context including:
- Timestamp
- Sandbox ID
- Project ID
- User ID
- Message ID
- Error type and message
- Stack trace
- E2B-specific error codes
- Request context (images, file editions, selections)

### Error Tracker Utility

The `ErrorTracker` utility (`lib/error-tracker.ts`) provides:
- In-memory error storage (last 100 errors)
- Error categorization by type and operation
- Project and sandbox-specific error filtering
- Error statistics and analysis

## Debugging Endpoints

### View All Tracked Errors

```bash
# Get all errors with statistics
curl http://localhost:3210/api/debug/errors

# Get only statistics
curl http://localhost:3210/api/debug/errors?stats=true

# Get errors for a specific project
curl http://localhost:3210/api/debug/errors?projectId=PROJECT_ID

# Get errors for a specific sandbox
curl http://localhost:3210/api/debug/errors?sandboxId=SANDBOX_ID
```

### Clear Tracked Errors

```bash
# Clear all errors
curl -X DELETE http://localhost:3210/api/debug/errors

# Clear errors for a specific project
curl -X DELETE http://localhost:3210/api/debug/errors?projectId=PROJECT_ID
```

## Error Patterns and Solutions

### 1. "SandboxError: 2: [unknown] terminated"

**Symptoms:**
- Chat stream stops abruptly
- No clear error message in logs
- Connection appears to drop

**Possible Causes:**

1. **Sandbox killed/paused externally**
   - Check E2B dashboard for sandbox status
   - Verify sandbox wasn't manually stopped

2. **Connection to E2B lost**
   - Check network connectivity
   - Review E2B service status
   - Look for network interruptions in logs

3. **Sandbox ran out of resources**
   - Check memory/CPU usage
   - Review sandbox resource limits in `sandbox-templates/*/e2b.toml`
   - Consider increasing resource allocation

4. **Timeout exceeded**
   - Current timeout settings:
     - `E2B_SANDBOX_TIMEOUT_MS` (default: 3600000 = 1 hour)
     - `E2B_SANDBOX_REQUEST_TIMEOUT_MS` (default: 3600000 = 1 hour)
   - Increase timeouts in `.env.local` if needed

**How to Debug:**

1. **Check the enhanced logs:**
   ```
   Look for: "==================== SANDBOX EXECUTION ERROR ===================="
   ```

2. **Review error details:**
   - Sandbox ID
   - Duration before failure
   - Last stdout/stderr output
   - Exit code

3. **Use the debug endpoint:**
   ```bash
   curl http://localhost:3210/api/debug/errors?sandboxId=YOUR_SANDBOX_ID
   ```

4. **Check Pusher notifications:**
   - Errors are sent to `{projectId}-errors` channel
   - Look for `error-notification` events

### 2. Timeout Errors

**Symptoms:**
- "timeout" in error message
- Long-running operations fail

**Solutions:**
- Increase timeout values in `.env.local`:
  ```env
  E2B_SANDBOX_TIMEOUT_MS=7200000  # 2 hours
  E2B_SANDBOX_REQUEST_TIMEOUT_MS=7200000  # 2 hours
  ```

### 3. Connection Errors

**Symptoms:**
- "connection" in error message
- Intermittent failures

**Solutions:**
- Check network stability
- Review E2B API status
- Implement retry logic if needed

## Log Markers

Look for these markers in your console logs:

### Service Layer (`lib/claude-code-service.ts`)
```
[Claude Code Service] Starting sandbox execution
[Claude Code Service] after execution
==================== SANDBOX EXECUTION ERROR ====================
[Claude Code Service] SANDBOX TERMINATED - Possible causes:
```

### API Route Layer (`app/api/claude-code/route.ts`)
```
[Claude Code API] before generateApp
[Claude Code API] Stream error received from service:
==================== CLAUDE CODE API STREAM ERROR ====================
```

### Chat Route Layer (`app/api/chat/route.ts`)
```
[Chat Route] Received request with:
[Chat Route] Stream ended. Received completion:
==================== CHAT STREAM ERROR ====================
```

## Real-time Monitoring

### Pusher Error Notifications

Errors are sent to Pusher channels for real-time monitoring:

```typescript
// Subscribe to error channel in your frontend
const channel = pusher.subscribe(`${projectId}-errors`)
channel.bind('error-notification', (data) => {
  console.error('Error notification:', data)
  // data contains:
  // - message
  // - timestamp
  // - projectId
  // - type ('sdk-error' or 'execution-error')
  // - errorDetails (for execution errors)
})
```

## Environment Variables

Key environment variables for debugging:

```env
# Enable debug endpoint in production (not recommended)
ENABLE_ERROR_DEBUG=true

# Timeout settings
E2B_SANDBOX_TIMEOUT_MS=3600000
E2B_SANDBOX_REQUEST_TIMEOUT_MS=3600000

# E2B configuration
E2B_API_KEY=your_api_key
```

## Common Debugging Workflow

1. **When an error occurs:**
   - Check console logs for error markers
   - Note the sandbox ID and project ID
   - Check timestamp

2. **Gather context:**
   ```bash
   curl http://localhost:3210/api/debug/errors?projectId=PROJECT_ID
   ```

3. **Analyze the error:**
   - Review error type and message
   - Check duration before failure
   - Look at last stdout/stderr
   - Review request context

4. **Check E2B Dashboard:**
   - Verify sandbox status
   - Review resource usage
   - Check for any E2B service issues

5. **Review recent changes:**
   - Check if timeout settings changed
   - Review recent code changes
   - Verify environment configuration

## Tips

1. **Keep logs organized:** Use the error markers to quickly find relevant log sections
2. **Use debug endpoint:** The `/api/debug/errors` endpoint provides quick access to error history
3. **Monitor Pusher:** Subscribe to error channels for real-time alerts
4. **Track patterns:** Use error statistics to identify recurring issues
5. **Resource monitoring:** Keep an eye on sandbox resource usage to prevent resource-related terminations

## Production Considerations

In production:
- Error debug endpoint is disabled by default (set `ENABLE_ERROR_DEBUG=true` to enable)
- Errors are still logged to console for monitoring systems to capture
- Consider integrating with error tracking services (Sentry, Rollbar, etc.)
- Set up alerts for specific error patterns
- Monitor error rates and trends

## Need Help?

If you encounter persistent errors:
1. Gather error details using the debug endpoint
2. Check E2B service status
3. Review recent changes to timeout or resource settings
4. Consider increasing sandbox resources
5. Check for network or infrastructure issues
