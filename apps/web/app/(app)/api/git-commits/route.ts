import { getGitCommits } from '@flutter-vibe-code/restore/api'
import { NextRequest } from 'next/server'

export const maxDuration = 30

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await getGitCommits(body)

    if (!result.success) {
      const status = result.error === 'Project not found or access denied' ? 404 :
                     result.error?.includes('required') ? 400 : 500
      return Response.json(
        { error: result.error, details: result.details },
        { status, headers: corsHeaders }
      )
    }

    return Response.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('[Git Commits] Error in API:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
