import { NextRequest } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'
import { connectSandbox } from '@/lib/sandbox-connect'
import { startCloudflareTunnel } from '@/lib/cloudflare-tunnel'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { sandboxId, projectId, userId, action = 'start_backup', tunnelMode = 'cloudflare' } = await req.json()

    if (!sandboxId || !projectId || !userId) {
      return Response.json({ success: false, error: 'Missing required parameters' }, { status: 400 })
    }

    console.log('[TunnelBackupServer] Action:', action, 'Sandbox:', sandboxId)

    let sandbox: Sandbox
    try {
      sandbox = await connectSandbox(sandboxId)
    } catch (error: any) {
      console.error('[TunnelBackupServer] Failed to connect to sandbox:', error)
      return Response.json({ success: false, error: 'Failed to connect to sandbox' }, { status: 500 })
    }

    const portCheck = await sandbox.commands.run(
      'curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 || echo "000"',
      { timeoutMs: 5000 }
    )
    const serverRunning = portCheck.stdout.includes('200') || portCheck.stdout.includes('404')

    if (!serverRunning && action !== 'cleanup_and_restart') {
      console.log('[TunnelBackupServer] Server not running, cannot create backup tunnel')
      return Response.json({ success: false, error: 'Server not running in sandbox' }, { status: 500 })
    }

    const sandboxUrl = `https://${sandbox.getHost(8081)}`
    let tunnelUrl = sandboxUrl

    if (tunnelMode === 'cloudflare') {
      try {
        tunnelUrl = await startCloudflareTunnel(8100, sandboxId)
        console.log('[TunnelBackupServer] Cloudflare tunnel:', tunnelUrl)
      } catch (tunnelError: any) {
        console.error('[TunnelBackupServer] Cloudflare tunnel failed, using E2B URL:', tunnelError.message)
        tunnelUrl = sandboxUrl
      }
    }

    return Response.json({
      success: true,
      sandboxUrl,
      tunnelUrl,
      serverStatus: 'running',
    })
  } catch (error: any) {
    console.error('[TunnelBackupServer] Error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

