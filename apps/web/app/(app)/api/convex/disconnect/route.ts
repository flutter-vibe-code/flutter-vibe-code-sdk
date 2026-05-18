// API endpoint to disconnect a project from Convex

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects, convexProjectCredentials } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'
import { deleteManagedProject, getManagedProjectId } from '@/lib/convex/management-api'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // Verify project belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
      .limit(1)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get credentials to check mode
    const [credentials] = await db
      .select()
      .from(convexProjectCredentials)
      .where(eq(convexProjectCredentials.projectId, projectId))
      .limit(1)

    // If it's a managed project, also delete from Convex
    if (credentials && credentials.mode === 'managed') {
      const teamScopedToken = process.env.CONVEX_TEAM_SCOPED_TOKEN

      if (teamScopedToken) {
        try {
          // Get the Convex project ID
          const convexProjectId = await getManagedProjectId({
            teamScopedToken,
            teamSlug: credentials.teamSlug,
            projectSlug: credentials.projectSlug,
          })

          // Delete the project from Convex
          await deleteManagedProject({
            teamScopedToken,
            projectId: convexProjectId,
          })
        } catch (error) {
          // Log error but continue with cleanup
          console.error('Failed to delete managed Convex project:', error)
        }
      }
    }

    // Delete credentials
    await db
      .delete(convexProjectCredentials)
      .where(eq(convexProjectCredentials.projectId, projectId))

    // Clear convexProject field
    await db
      .update(projects)
      .set({
        convexProject: null,
        convexDevRunning: false,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in Convex disconnect API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
