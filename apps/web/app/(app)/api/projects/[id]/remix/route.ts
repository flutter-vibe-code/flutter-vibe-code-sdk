import { db } from '@/lib/db'
import { projects, subscriptions, chat, message, convexProjectCredentials } from '@flutter-vibe-code/database'
import { createRemix } from '@flutter-vibe-code/remix/api'
import { NextRequest } from 'next/server'

export const maxDuration = 300 // 5 minutes for remixing

/**
 * POST /api/projects/[id]/remix
 * Remix a public project
 * Creates a new project with code cloned from the original
 */
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  try {
    const body = await req.json()
    const { userID } = body

    if (!userID) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
      })
    }

    const result = await createRemix({
      sourceProjectId: params.id,
      userId: userID,
      db,
      projects,
      subscriptions,
      chat,
      message,
      convexProjectCredentials,
    })

    if (!result.success) {
      return new Response(JSON.stringify(result.error), {
        status: result.status,
      })
    }

    return new Response(JSON.stringify(result.data), { status: 201 })
  } catch (error) {
    console.error('[Remix] Error in fork API:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to remix project',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    )
  }
}
