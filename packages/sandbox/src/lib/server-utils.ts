import { db, projects, eq } from '@flutter-vibe-code/database'
import { Sandbox } from '@e2b/code-interpreter'
import { detectAndNotifyRuntimeError } from '@flutter-vibe-code/error-manager/server'

export type TunnelMode = 'e2b-public' | 'lan'

export async function startExpoServer(
  sandbox: Sandbox,
  projectId?: string,
  customE2bUrl?: string,
  tunnelMode: TunnelMode = 'e2b-public',
): Promise<{ url: string; serverReady: boolean; e2bUrl?: string }> {
  console.log('[Server Utils] Starting web server...')
  console.log('[Server Utils] ProjectId for error notifications:', projectId || 'NOT PROVIDED')

  let serverOutput = ''
  let webBundled = false
  let processHandle: any = null
  let port = 8081

  console.log('[Server Utils] sandboxId', sandbox.sandboxId)
  // Use E2B native URLs for sandbox access
  const e2bUrl = `https://${sandbox.getHost(port)}`

  console.log('[Server Utils] E2B URL:', e2bUrl)

  // Set sandbox timeout to 1 hour
  console.log('[Server Utils] Setting sandbox timeout to 1 hour...')
  try {
    await sandbox.setTimeout(3600000) // 1 hour in milliseconds
    console.log('[Server Utils] Sandbox timeout set successfully')
  } catch (error) {
    console.log('[Server Utils] Failed to set sandbox timeout:', error)
  }


  // Check if port 8081 is already in use (server already running)
  console.log(`[Server Utils] Checking port ${port} availability...`)
  try {
    const portCheck = await sandbox.commands.run(
      `netstat -tuln | grep :${port} || echo "PORT_AVAILABLE"`,
      { timeoutMs: 5000 },
    )

    if (!portCheck.stdout.includes('PORT_AVAILABLE')) {
      // Port 8081 is in use - check if it's a healthy server or zombie process
      console.log(`[Server Utils] Port ${port} is in use, checking if server is healthy...`)

      try {
        const healthCheck = await sandbox.commands.run(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port} || echo "000"`,
          { timeoutMs: 10000 },
        )

        if (
          healthCheck.stdout.includes('200') ||
          healthCheck.stdout.includes('404')
        ) {
          if (tunnelMode === 'lan') {
            // In LAN mode, leave the healthy Expo server running — only ngrok needs restarting
            console.log(`[Server Utils] ✅ Healthy server detected on port ${port}, keeping it running (LAN mode)`)
          } else {
            // In e2b-public mode, kill and restart to reconnect ngrok
            console.log(`[Server Utils] ✅ Healthy server detected on port ${port}, will still restart to reconnect ngrok`)
            console.log(`[Server Utils] Killing existing server to restart with new ngrok connection...`)
            try {
              await sandbox.commands.run(
                `lsof -ti:${port} | xargs kill -9 || true`,
                { timeoutMs: 10000 },
              )
              console.log('[Server Utils] Existing server killed, waiting for port to be freed...')
              await new Promise((resolve) => setTimeout(resolve, 2000))
            } catch (killError) {
              console.log('[Server Utils] Failed to kill existing server:', killError)
            }
          }
        } else {
          // Server is not responding - kill zombie process
          console.log(`[Server Utils] Port ${port} occupied but server not responding, killing zombie process...`)
          try {
            await sandbox.commands.run(
              `lsof -ti:${port} | xargs kill -9 || true`,
              { timeoutMs: 10000 },
            )
            console.log('[Server Utils] Zombie process killed, waiting for port to be freed...')
            await new Promise((resolve) => setTimeout(resolve, 2000))
          } catch (killError) {
            console.log('[Server Utils] Failed to kill zombie process:', killError)
          }
        }
      } catch (healthError) {
        console.log('[Server Utils] Health check failed, attempting to kill zombie process...')
        try {
          await sandbox.commands.run(
            `lsof -ti:${port} | xargs kill -9 || true`,
            { timeoutMs: 10000 },
          )
          console.log('[Server Utils] Process killed')
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (killError) {
          console.log('[Server Utils] Failed to kill process:', killError)
        }
      }
    }

    console.log(`[Server Utils] Port ${port} is available, starting new server...`)
  } catch (error) {
    console.log('[Server Utils] Port check failed, will attempt to start server anyway')
  }

  // Increase inotify limit for file watching
  console.log('[Server Utils] Setting inotify limits...')
  try {
    await sandbox.commands.run(
      'sudo sysctl fs.inotify.max_user_watches=524288',
      {
        timeoutMs: 10000,
      },
    )
    console.log('[Server Utils] inotify limits set successfully')
  } catch (error) {
    console.log('[Server Utils] Failed to set inotify limits:', error)
  }

  // Write EXPO_PUBLIC_PROJECT_ID to .env.local if projectId is provided
  if (projectId) {
    console.log('[Server Utils] Writing EXPO_PUBLIC_PROJECT_ID to .env.local...')
    try {
      // Read existing .env.local if it exists
      let envContent = ''
      try {
        envContent = await sandbox.files.read('/home/user/app/.env.local')
      } catch (error) {
        // File doesn't exist, that's okay
        console.log('[Server Utils] .env.local does not exist, creating new one')
      }

      // Parse existing lines
      const lines = envContent.split('\n').filter(line => line.trim() !== '')
      const envVars = new Map<string, string>()

      // Parse existing env vars
      for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          envVars.set(match[1], match[2])
        }
      }

      // Update/add EXPO_PUBLIC_PROJECT_ID
      envVars.set('EXPO_PUBLIC_PROJECT_ID', projectId)
      console.log('[Server Utils] Set EXPO_PUBLIC_PROJECT_ID:', projectId)

      // Set EXPO_PUBLIC_SANDBOX_ID so the hover system can identify the sandbox
      envVars.set('EXPO_PUBLIC_SANDBOX_ID', sandbox.sandboxId)
      console.log('[Server Utils] Set EXPO_PUBLIC_SANDBOX_ID:', sandbox.sandboxId)

      // Convert map back to lines
      const newLines = Array.from(envVars.entries()).map(
        ([key, value]) => `${key}=${value}`
      )

      // Write back to file
      await sandbox.files.write('/home/user/app/.env.local', newLines.join('\n') + '\n')
      console.log('[Server Utils] EXPO_PUBLIC_PROJECT_ID written to .env.local successfully')
    } catch (error) {
      console.log('[Server Utils] Failed to write to .env.local:', error)
    }
  }

  // Configure ngrok auth token
  console.log('[Server Utils] Configuring ngrok auth token...')
  try {
    await sandbox.commands.run(
      `ngrok config add-authtoken ${process.env.NGROK_AUTHTOKEN}`,
      {
        onStdout: (data: string) => {
          console.log('[Server Utils] NGROK CONFIG STDOUT:', data)
        },
        onStderr: (data: string) => {
          console.log('[Server Utils] NGROK CONFIG STDERR:', data)
        },
      },
    )
    console.log('[Server Utils] Ngrok configured successfully')
  } catch (error) {
    console.log('[Server Utils] Failed to configure ngrok:', error)
  }

  // Verify bun is available (should be system-wide from imbios/bun-node image)
  console.log('[Server Utils] Verifying bun installation...')
  try {
    const verifyResult = await sandbox.commands.run('which bun', { timeoutMs: 5000 })
    console.log('[Server Utils] Bun location:', verifyResult.stdout.trim())
  } catch (error) {
    console.log('[Server Utils] Bun not found in PATH:', error)
  }

  // Patch app.json web output to "static" if needed — apps with "output": "server"
  // (SSR/RSC mode) can prevent expo start --web from serving on port 8081 in dev.
  console.log('[Server Utils] Patching app.json web output to static if needed...')
  try {
    await sandbox.commands.run(
      `node -e "try{const fs=require('fs'),p='/home/user/app/app.json',a=JSON.parse(fs.readFileSync(p,'utf8'));if(a.expo&&a.expo.web&&a.expo.web.output==='server'){a.expo.web.output='static';fs.writeFileSync(p,JSON.stringify(a,null,2));console.log('Patched to static');}else{console.log('No patch needed');}}catch(e){console.log('Skip patch:',e.message);}"`,
      { timeoutMs: 5000 }
    )
  } catch (error) {
    console.log('[Server Utils] app.json patch failed (non-fatal):', error)
  }

  // Start the web server in background
  // Build the command based on tunnel mode
  // In LAN mode, use `bunx expo start` directly to bypass the e2b-publiced start script
  const startCommand = tunnelMode === 'lan'
    ? `cd /home/user/app && CI=false bun install && EXPO_PACKAGER_PROXY_URL=${e2bUrl} bunx expo start --lan --web`
    : `cd /home/user/app && CI=false bun install && bun run start -- --ngrokurl ${e2bUrl} --tunnel --web`

  console.log('[Server Utils] Starting with command:', startCommand)
  console.log('[Server Utils] Tunnel mode:', tunnelMode)

  const webServerProcess = sandbox.commands
    .run(
      startCommand,
      {
        envs: {},
        requestTimeoutMs: 3600000,
        timeoutMs: 3600000,
        background: true,
        onStdout: (data: string) => {
          console.log('[Server Utils] SERVER STDOUT:', data)
          serverOutput += data

          // Check for runtime errors and send notifications
          detectAndNotifyRuntimeError(data, projectId)

          // Check for Web Bundled specifically
          if (
            data.includes('Web Bundled') ||
            data.includes(`Waiting on http://localhost:${port}`)
          ) {
            console.log('[Server Utils] Web Bundled: true')
            webBundled = true
          }

          // Check for Tunnel ready confirmation
          if (data.includes('Tunnel ready') || data.includes('Tunnel connected')) {
            console.log('[Server Utils] Tunnel ready detected')
          }
        },
        onStderr: (data: string) => {
          console.log('SERVER STDERR:', data)
          serverOutput += data

          // Check for runtime errors in stderr as well
          detectAndNotifyRuntimeError(data, projectId)
        },
      },
    )
    .catch((err: any) => console.log('Server process error:', err))

  // Store the process handle when it resolves
  webServerProcess
    .then((proc) => {
      processHandle = proc
    })
    .catch(() => {
      // Process handle assignment failed
    })

  console.log('Waiting for server to start...')

  // Wait for webBundled with timeout and health checks
  const maxWaitTime = 60000 // 60 seconds (reduced from 120)
  const checkInterval = 3000 // 3 seconds
  let waitTime = 0
  let consecutiveSuccessfulChecks = 0

  while (!webBundled && waitTime < maxWaitTime) {
    await new Promise((resolve) => setTimeout(resolve, checkInterval))
    waitTime += checkInterval

    // Try to ping the server directly
    try {
      console.log(`[Server Utils] Running health check at ${waitTime}ms...`)
      const healthCheck = await sandbox.commands.run(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port} || echo "000"`,
        { timeoutMs: 10000 },
      )

      console.log(`[Server Utils] Health check response: ${healthCheck.stdout.trim()}`)

      if (
        healthCheck.stdout.includes('200') ||
        healthCheck.stdout.includes('404')
      ) {
        consecutiveSuccessfulChecks++
        console.log(`[Server Utils] ✅ Server responding to HTTP requests (${consecutiveSuccessfulChecks} consecutive checks)`)

        // Consider server ready after 2 consecutive successful health checks
        if (consecutiveSuccessfulChecks >= 2) {
          console.log('[Server Utils] Server is stable and responding, considering it ready')
          webBundled = true
          break
        }
      } else {
        consecutiveSuccessfulChecks = 0
        console.log(`[Server Utils] ❌ Server not ready yet, response code: ${healthCheck.stdout.trim()}`)
      }
    } catch (error) {
      consecutiveSuccessfulChecks = 0
      console.log(`[Server Utils] ❌ Health check error: ${error}`)
    }

    if (!webBundled) {
      console.log(`[Server Utils] Still waiting for server... ${waitTime}ms elapsed`)
    }
  }

  // In LAN mode, start ngrok as a separate background process after Expo is ready


  // Get the public URL using e2b's getHost method
  const publicHost = sandbox.getHost(port)
  // Include sandboxId as query parameter for the hover system
  const publicUrl = `https://${publicHost}?sandboxId=${sandbox.sandboxId}`

  console.log('E2B public URL:', publicUrl)

  if (!webBundled) {
    console.warn('WebBundled not detected, but proceeding with URL')
  }

  console.log('[Server Utils] Final e2bUrl value:', e2bUrl)
  console.log('[Server Utils] Server ready status:', webBundled)

  // Save server info to database if projectId is provided
  if (projectId) {
    try {
      await db
        .update(projects)
        .set({
          sandboxUrl: publicUrl,
          serverReady: webBundled,
          e2bUrl: e2bUrl,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))

      console.log(
        `[Server Utils] Saved server info to database for project ${projectId}`,
      )

      if (e2bUrl) {
        console.log(`[Server Utils] Ngrok URL saved to database: ${e2bUrl}`)
      }
    } catch (error) {
      console.error(
        `[Server Utils] Failed to save server info to database: ${error}`,
      )
      // Don't fail the entire operation if database update fails
    }
  }

  return {
    url: publicUrl,
    serverReady: webBundled,
    e2bUrl: e2bUrl,
  }
}

// ============================================================================
// Flutter dev server
// ============================================================================
//
// Boots a `flutter run -d web-server` inside the sandbox and waits for the
// HTTP port to respond. Designed to be a drop-in replacement for
// startExpoServer in the Flutter migration: same return shape so callers don't
// need to branch.

export async function startFlutterServer(
  sandbox: Sandbox,
  projectId?: string,
  _customE2bUrl?: string,
  _tunnelMode: TunnelMode = 'e2b-public',
): Promise<{ url: string; serverReady: boolean; e2bUrl?: string }> {
  console.log('[Flutter Server] Starting flutter run -d web-server...')
  console.log('[Flutter Server] ProjectId:', projectId || '(none)')

  const port = 3000
  const e2bUrl = `https://${sandbox.getHost(port)}`
  console.log('[Flutter Server] E2B URL:', e2bUrl)

  try {
    await sandbox.setTimeout(3600000)
  } catch (e) {
    console.log('[Flutter Server] setTimeout failed:', e)
  }

  // If port 3000 already has something listening that responds 200/404 keep it.
  // Otherwise kill the zombie and relaunch.
  try {
    const portCheck = await sandbox.commands.run(
      `netstat -tuln | grep :${port} || echo PORT_AVAILABLE`,
      { timeoutMs: 5000 },
    )
    const portInUse = !portCheck.stdout.includes('PORT_AVAILABLE')
    if (portInUse) {
      const health = await sandbox.commands.run(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port} || echo 000`,
        { timeoutMs: 8000 },
      )
      if (health.stdout.includes('200') || health.stdout.includes('404')) {
        console.log('[Flutter Server] Healthy server already running, reusing')
        return { url: e2bUrl, serverReady: true, e2bUrl }
      }
      console.log('[Flutter Server] Zombie on port, killing')
      await sandbox.commands.run(`lsof -ti:${port} | xargs -r kill -9 || true`, { timeoutMs: 8000 })
      await new Promise((r) => setTimeout(r, 1500))
    }
  } catch (e) {
    console.log('[Flutter Server] Port pre-check failed:', e)
  }

  // Launch flutter run in background in DEBUG mode (default). The Mixed
  // Content issue with dwds WebSocket is solved by the WebSocket monkey-patch
  // injected into web/index.html during template build. So debug + HTTPS
  // preview + hot reload all coexist.
  const startCmd = [
    'cd /home/user/app',
    'rm -f /tmp/flutter.log',
    `nohup flutter run -d web-server --web-hostname 0.0.0.0 --web-port ${port} > /tmp/flutter.log 2>&1 &`,
    'disown',
  ].join(' && ')

  try {
    await sandbox.commands.run(startCmd, { timeoutMs: 15000 })
  } catch (e) {
    console.log('[Flutter Server] launch command failed:', e)
  }

  // Poll for the server to come up. flutter run -d web-server typically takes
  // 5-30s on a warm container; first run on a cold one can be 60s+.
  const startedAt = Date.now()
  const maxWait = 120_000
  let ready = false
  while (Date.now() - startedAt < maxWait) {
    await new Promise((r) => setTimeout(r, 2000))
    try {
      const probe = await sandbox.commands.run(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port} || echo 000`,
        { timeoutMs: 5000 },
      )
      const code = probe.stdout.trim()
      if (code === '200' || code === '404' || code === '302') {
        ready = true
        break
      }
    } catch (e) {
      // keep polling
    }
  }

  if (!ready) {
    console.log('[Flutter Server] Did not become ready within ', maxWait, 'ms')
    if (projectId) {
      try {
        const log = await sandbox.commands.run('tail -50 /tmp/flutter.log 2>&1 || true', { timeoutMs: 5000 })
        console.log('[Flutter Server] flutter.log tail:\\n' + log.stdout)
        await detectAndNotifyRuntimeError(projectId, log.stdout || 'flutter dev server failed to start')
      } catch (e) {
        console.log('[Flutter Server] Could not read flutter.log:', e)
      }
    }
    return { url: e2bUrl, serverReady: false, e2bUrl }
  }

  // Persist serverReady on the project row so subsequent calls short-circuit.
  if (projectId) {
    try {
      await db.update(projects)
        .set({ sandboxUrl: e2bUrl, serverReady: true, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
    } catch (e) {
      console.log('[Flutter Server] DB update failed:', e)
    }
  }

  console.log('[Flutter Server] Ready in', Math.round((Date.now() - startedAt) / 1000), 's')
  return { url: e2bUrl, serverReady: true, e2bUrl }
}
