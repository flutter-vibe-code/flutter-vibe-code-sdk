import { db } from '@/lib/db'
import { projects, user } from '@flutter-vibe-code/database'
import { Sandbox } from '@e2b/code-interpreter'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/admin'
import { eq, isNotNull, ne, sql } from 'drizzle-orm'
import { headers } from 'next/headers'

export const maxDuration = 120

/**
 * Compare projects.sandboxId in DB vs Sandbox.list() in E2B, mark every
 * project whose sandbox is no longer running (or is gone) as destroyed.
 *
 * Admin-only (isAdmin email check via better-auth session).
 *
 * GET → dry-run, returns orphans without writing.
 * POST → applies changes (sets sandboxStatus='destroyed', sandboxId=null,
 *        serverStatus='closed', serverReady=false).
 */
async function ensureAdmin(): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.email) {
      return { ok: false, status: 401, error: 'Not authenticated' }
    }
    if (!isAdmin(session.user.email)) {
      return { ok: false, status: 403, error: 'Admin only' }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, status: 500, error: (e as Error).message }
  }
}

async function findOrphans() {
  const dbRows = await db
    .select({ id: projects.id, sandboxId: projects.sandboxId, title: projects.title, userId: projects.userId })
    .from(projects)
    .where(isNotNull(projects.sandboxId))

  const dbWithSandbox = dbRows.filter((r) => !!r.sandboxId)
  const dbSandboxIds = new Set(dbWithSandbox.map((r) => r.sandboxId as string))

  const liveSandboxIds = new Set<string>()
  let listError: string | null = null
  try {
    const paginator = Sandbox.list()
    // SandboxPaginator: iterate until exhausted.
    while (paginator.hasNext) {
      const page = await paginator.nextItems()
      for (const sb of page) {
        if ((sb as any).sandboxId) liveSandboxIds.add((sb as any).sandboxId)
      }
    }
  } catch (e) {
    listError = (e as Error).message
    console.error('[Cleanup Orphans] Sandbox.list failed:', listError)
  }

  const orphans = dbWithSandbox.filter((r) => !liveSandboxIds.has(r.sandboxId as string))

  return {
    dbCount: dbWithSandbox.length,
    liveCount: liveSandboxIds.size,
    orphanCount: orphans.length,
    orphans: orphans.map((o) => ({
      projectId: o.id,
      sandboxId: o.sandboxId,
      title: o.title,
      userId: o.userId,
    })),
    listError,
  }
}

export async function GET() {
  const guard = await ensureAdmin()
  if (!guard.ok) return Response.json({ error: guard.error }, { status: guard.status })

  const report = await findOrphans()
  return Response.json({ dryRun: true, ...report })
}

export async function POST() {
  const guard = await ensureAdmin()
  if (!guard.ok) return Response.json({ error: guard.error }, { status: guard.status })

  const report = await findOrphans()

  let updated = 0
  for (const orphan of report.orphans) {
    try {
      await db
        .update(projects)
        .set({
          sandboxId: null,
          sandboxStatus: 'destroyed',
          serverStatus: 'closed',
          serverReady: false,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, orphan.projectId))
      updated++
    } catch (e) {
      console.error('[Cleanup Orphans] Failed to update', orphan.projectId, e)
    }
  }

  console.log(
    `[Cleanup Orphans] db=${report.dbCount} live=${report.liveCount} orphans=${report.orphanCount} updated=${updated}`,
  )

  return Response.json({
    dryRun: false,
    ...report,
    updated,
  })
}
