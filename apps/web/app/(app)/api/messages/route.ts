import { getProjectMessages } from '@/lib/db'
import { NextResponse } from 'next/server'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

/**
 * GET endpoint to fetch the latest messages for a project.
 * Used by the stream recovery hook to fetch messages when streaming stalls.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    const userId = url.searchParams.get('userId')
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'Project ID and User ID are required' },
        { status: 400, headers: corsHeaders },
      )
    }

    console.log('[Messages API] Fetching messages for stream recovery:', {
      projectId,
      userId,
      limit,
    })

    const messages = await getProjectMessages(projectId, userId, limit)

    console.log('[Messages API] Fetched', messages?.length || 0, 'messages')

    return NextResponse.json({ messages }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Messages API] Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500, headers: corsHeaders },
    )
  }
}
