import { NextRequest, NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher'

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { sandboxId, enabled } = await req.json()
    
    console.log('[API] Received hover mode toggle request:', { sandboxId, enabled })
    
    if (!sandboxId || typeof enabled !== 'boolean') {
      console.error('[API] Invalid request params:', { sandboxId, enabled })
      return NextResponse.json(
        { error: 'Missing sandboxId or enabled boolean' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }
    
    const channelName = `sandbox-${sandboxId}`
    console.log(`[API] Triggering hover-mode-toggle event on channel: ${channelName}`)
    
    // Trigger the hover mode toggle event
    await pusherServer.trigger(channelName, 'hover-mode-toggle', { enabled })
    
    console.log('[API] Successfully triggered hover mode toggle event')
    
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  } catch (error) {
    console.error('[API] Hover mode toggle trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger hover mode toggle event' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
}