import { restoreGitCommit } from '@flutter-vibe-code/restore/api'
import { NextRequest } from 'next/server'

export const maxDuration = 120 // 2 minutes for git operations

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await restoreGitCommit(body)

    if (!result.success) {
      const status = result.error === 'Project not found or access denied' ? 404 :
                     result.error?.includes('required') ? 400 : 500
      return Response.json(
        { error: result.error, details: result.details },
        { status }
      )
    }

    return Response.json(result)
  } catch (error) {
    console.error('[Git Restore] Error in API:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
