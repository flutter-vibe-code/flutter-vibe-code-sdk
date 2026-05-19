import { NextRequest } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { tunnelUrl, sandboxId, checkPort = 3000 } = await req.json()

    if (!tunnelUrl || !sandboxId) {
      return Response.json({ isAlive: false, error: 'Missing tunnelUrl or sandboxId' })
    }

    console.log('[CheckTunnelHealth] Checking:', tunnelUrl)

    let isAlive = false
    let tunnelStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown'

    try {
      const response = await fetch(tunnelUrl, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      })
      isAlive = response.ok || response.status === 404
      tunnelStatus = isAlive ? 'connected' : 'disconnected'
      console.log(`[CheckTunnelHealth] Response: ${response.status}, alive: ${isAlive}`)
    } catch (error: any) {
      console.log('[CheckTunnelHealth] Fetch failed:', error.message)
      tunnelStatus = 'disconnected'
    }

    return Response.json({
      isAlive,
      tunnelStatus,
      checkPort,
      serverStatus: isAlive ? 'running' : 'stopped',
    })
  } catch (error: any) {
    console.error('[CheckTunnelHealth] Error:', error)
    return Response.json({ isAlive: false, error: error.message }, { status: 500 })
  }
}

