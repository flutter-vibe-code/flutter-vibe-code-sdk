import { NextResponse } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'
import { connectSandbox } from '@/lib/sandbox-connect'
import { db, projects, eq } from '@/lib/db'

export const maxDuration = 60 // 60 seconds

export async function POST(req: Request) {
  try {
    const { sandboxId, projectId } = await req.json()

    if (!sandboxId) {
      return NextResponse.json(
        { error: 'sandboxId is required' },
        { status: 400 }
      )
    }

    console.log('[Tunnel API] Starting tunnel for sandbox:', sandboxId)

    // Connect to sandbox
    let sandbox: Sandbox
    try {
      sandbox = await connectSandbox(sandboxId)
      console.log('[Tunnel API] Connected to sandbox:', sandbox.sandboxId)
    } catch (error) {
      console.error('[Tunnel API] Failed to connect to sandbox:', error)
      return NextResponse.json(
        { error: 'Failed to connect to sandbox' },
        { status: 500 }
      )
    }

    // Check port 3000 first (Flutter), then 8081 (Expo)
    let serverReady = false
    let activePort = 0
    const portsToCheck = [3000, 8081]
    
    for (const port of portsToCheck) {
      try {
        const healthCheck = await sandbox.commands.run(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port} || echo "000"`,
          { timeoutMs: 10000 }
        )
        const code = healthCheck.stdout.trim()
        console.log('[Tunnel API] Port', port, 'health check:', code)
        if (code === '200' || code === '404' || code === '302') {
          serverReady = true
          activePort = port
          break
        }
      } catch (error) {
        console.log('[Tunnel API] Port', port, 'not ready:', error)
      }
    }

    if (!serverReady || activePort === 0) {
      // Return the E2B URL directly for Flutter (port 3000)
      const e2bUrl = `https://${sandbox.getHost(3000)}?sandboxId=${sandboxId}`
      console.log('[Tunnel API] Server not ready, returning E2B URL:', e2bUrl)
      return NextResponse.json({
        tunnelUrl: e2bUrl,
        fallback: true,
        serverReady: false
      })
    }

    // Use E2B URL with correct port
    const e2bUrl = `https://${sandbox.getHost(activePort)}?sandboxId=${sandboxId}`
    console.log('[Tunnel API] Using E2B URL with port', activePort, ':', e2bUrl)

    // Update project with URL if projectId provided
    if (projectId) {
      try {
        await db.update(projects)
          .set({ sandboxUrl: e2bUrl, updatedAt: new Date() })
          .where(eq(projects.id, projectId))
        console.log('[Tunnel API] Updated project with E2B URL')
      } catch (error) {
        console.log('[Tunnel API] Failed to update project:', error)
      }
    }

    console.log('[Tunnel API] Done, URL:', e2bUrl)

    return NextResponse.json({
      tunnelUrl: e2bUrl,
      fallback: false,
      serverReady: true,
      source: 'e2b',
      port: activePort
    })

  } catch (error) {
    console.error('[Tunnel API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
