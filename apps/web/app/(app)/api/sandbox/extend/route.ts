import { db } from '@/lib/db'
import { projects } from '@flutter-vibe-code/database'
import { connectSandbox, sandboxTimeout } from '@/lib/sandbox-connect'
import { eq, and } from 'drizzle-orm'
import { NextRequest } from 'next/server'

export const maxDuration = 30

/**
 * Extend the active sandbox lifetime back to the full configured timeout
 * (default 1h). Called from the SandboxExpiryBanner "Extend" button when
 * the user wants more time before the sandbox auto-kills.
 */
export async function POST(req: NextRequest) {
  try {
    const { projectId, userID } = await req.json()

    if (!projectId || !userID) {
      return Response.json(
        { error: 'projectId and userID are required' },
        { status: 400 },
      )
    }

    const rows = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.userId, userID),
          eq(projects.status, 'active'),
        ),
      )
      .limit(1)

    if (rows.length === 0) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = rows[0]
    if (!project.sandboxId) {
      return Response.json(
        { error: 'No sandbox for project' },
        { status: 404 },
      )
    }

    const sandbox = await connectSandbox(project.sandboxId)
    if (!sandbox) {
      return Response.json(
        { error: 'Sandbox is dead or unreachable' },
        { status: 410 },
      )
    }

    await sandbox.setTimeout(sandboxTimeout)
    const info = await sandbox.getInfo()

    console.log(
      `[Sandbox Extend] project=${projectId} sandbox=${project.sandboxId} extended to ${info.endAt}`,
    )

    return Response.json({
      ok: true,
      sandboxId: info.sandboxId,
      startedAt: info.startedAt,
      endAt: info.endAt,
      extendedByMs: sandboxTimeout,
    })
  } catch (error) {
    console.error('[Sandbox Extend] Error:', error)
    return Response.json(
      {
        error: 'Failed to extend sandbox',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
