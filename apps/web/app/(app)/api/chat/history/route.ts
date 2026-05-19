import { getProjectMessages } from '@/lib/db'
import { db, projects, eq } from '@flutter-vibe-code/database'
import { NextResponse } from 'next/server'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'
import { CHAT_HISTORY_LIMIT } from '@/lib/chat-config'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(req: Request) {
  try {
    const { projectId, userId: bodyUserId, limit: requestedLimit } = await req.json()
    const limit = requestedLimit || CHAT_HISTORY_LIMIT

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400, headers: corsHeaders },
      )
    }

    // If userId not provided (mobile app), look it up from the project
    let userId = bodyUserId
    if (!userId) {
      const project = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)

      if (project.length === 0) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404, headers: corsHeaders },
        )
      }
      userId = project[0].userId
    }

    console.log('Chat history API called:', { projectId, userId, limit })

    const messages = await getProjectMessages(projectId, userId, limit)
    console.log('Messages fetched:', messages?.length || 0, 'messages')

    return NextResponse.json({ messages }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500, headers: corsHeaders },
    )
  }
}
