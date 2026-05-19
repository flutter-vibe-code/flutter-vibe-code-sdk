import { db } from '@/lib/db'
import { projects, user } from '@flutter-vibe-code/database'
import { getPublicProject } from '@flutter-vibe-code/remix/api'
import { NextRequest } from 'next/server'

/**
 * GET /api/projects/[id]/public
 * Fetch public project information without authentication
 * Returns 404 if project is not public
 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  const result = await getPublicProject({
    projectId: params.id,
    db,
    projects,
    user,
  })

  if (!result.success) {
    return new Response(JSON.stringify(result.error), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(result.data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
