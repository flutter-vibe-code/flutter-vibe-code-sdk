import { commitToGitHub } from '@flutter-vibe-code/restore/api'
import { NextRequest } from 'next/server'

export const maxDuration = 300 // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await commitToGitHub(body)

    if (!result.success && !result.skipped) {
      return Response.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return Response.json(result)
  } catch (error) {
    console.error('[GitHub Commit API] Error:', error)
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
