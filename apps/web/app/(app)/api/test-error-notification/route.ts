import { pusherServer } from '@/lib/pusher'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { projectId, errorMessage } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 },
      )
    }

    const channelName = `${projectId}-errors`
    console.log(
      '[Test Error API] Sending test error notification to channel:',
      channelName,
    )

    // Use custom error message if provided, otherwise use default
    const message = errorMessage || 'TEST ERROR: This is a manually triggered error notification to test the system.'

    await pusherServer.trigger(channelName, 'error-notification', {
      message,
      timestamp: new Date().toISOString(),
      projectId,
    })

    console.log('[Test Error API] Test error notification sent successfully')
    return NextResponse.json({ success: true, channel: channelName })
  } catch (error) {
    console.error('[Test Error API] Failed to send test notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 },
    )
  }
}
