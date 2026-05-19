import { NextRequest } from 'next/server'
import { startCloudflareTunnel } from '@/lib/cloudflare-tunnel'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { port = 8081, identifier } = await req.json()

    if (!identifier) {
      return Response.json({ success: false, error: 'Missing identifier' }, { status: 400 })
    }

    const tunnelUrl = await startCloudflareTunnel(port, identifier)

    return Response.json({
      success: true,
      tunnelUrl,
      port,
    })
  } catch (error: any) {
    console.error('[TunnelServe] Error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

