import { NextRequest, NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    
    const socketId = params.get('socket_id')
    const channelName = params.get('channel_name')
    
    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      )
    }
    
    // For now, allow all sandbox channels
    // In production, you should verify the user has access to the sandbox
    if (channelName.startsWith('sandbox-')) {
      const auth = pusherServer.authorizeChannel(socketId, channelName)
      return NextResponse.json(auth)
    }
    
    return NextResponse.json(
      { error: 'Unauthorized channel' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}