// API endpoint to disconnect and delete a managed Convex project

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

    // Get team-scoped token from environment
    const teamScopedToken = process.env.CONVEX_TEAM_SCOPED_TOKEN

    if (!teamScopedToken) {
      return NextResponse.json(
        { error: 'Managed Convex not configured. Missing CONVEX_TEAM_SCOPED_TOKEN' },
        { status: 500 }
      )
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

    // Get credentials to find Convex project details
    const [credentials] = await db
      .select()
      .from(convexProjectCredentials)
      .where(
        and(
          eq(convexProjectCredentials.projectId, projectId),
          eq(convexProjectCredentials.mode, 'managed')
        )
      )
      .limit(1)

    if (!credentials) {
      return NextResponse.json(
        { error: 'No managed Convex project found for this project' },
        { status: 404 }
      )
    }

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
      // The project might already be deleted or there might be a permission issue
      console.error('Failed to delete managed Convex project:', error)
    }

    // Delete credentials from database
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
    console.error('Error in managed Convex disconnect API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
