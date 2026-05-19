// API endpoint to create a platform-managed Convex project
// Creates project in platform's Convex team using team-scoped token

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects, convexProjectCredentials } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'
import { provisionManagedConvexProject } from '@/lib/convex/management-api'
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
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      )
    }

    // Get team-scoped token and team slug from environment
    const teamScopedToken = process.env.CONVEX_TEAM_SCOPED_TOKEN
    const teamSlug = process.env.CONVEX_TEAM_SLUG

    if (!teamScopedToken || !teamSlug) {
      return NextResponse.json(
        { error: 'Managed Convex not configured. Missing CONVEX_TEAM_SCOPED_TOKEN or CONVEX_TEAM_SLUG' },
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

    // Check if project already has Convex connected
    const [existingCredentials] = await db
      .select()
      .from(convexProjectCredentials)
      .where(eq(convexProjectCredentials.projectId, projectId))
      .limit(1)

    if (existingCredentials) {
      return NextResponse.json(
        { error: 'Project already has Convex connected' },
        { status: 400 }
      )
    }

    // Update project state to "connecting"
    await db
      .update(projects)
      .set({
        convexProject: { kind: 'connecting' },
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    try {
      // Generate unique project name: capsule-project-{projectId}
      const projectName = `capsule-project-${projectId}`

      // Provision the managed Convex project
      const convexProject = await provisionManagedConvexProject({
        teamScopedToken,
        teamSlug,
        projectName,
      })

      // Store credentials with mode='managed'
      await db.insert(convexProjectCredentials).values({
        projectId,
        userId: session.user.id,
        mode: 'managed',
        teamSlug: convexProject.teamSlug,
        projectSlug: convexProject.projectSlug,
        deploymentUrl: convexProject.deploymentUrl,
        deploymentName: convexProject.deploymentName,
        adminKey: convexProject.token,
        accessToken: null, // No OAuth token for managed mode
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Update project state to "connected"
      await db
        .update(projects)
        .set({
          convexProject: {
            kind: 'connected',
            projectSlug: convexProject.projectSlug,
            teamSlug: convexProject.teamSlug,
            deploymentUrl: convexProject.deploymentUrl,
            deploymentName: convexProject.deploymentName,
          },
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))

      return NextResponse.json({
        success: true,
        project: convexProject,
        mode: 'managed',
      })
    } catch (error) {
      console.error('Failed to provision managed Convex project:', error)

      // Update project state to "failed"
      const errorMessage = error instanceof Error ? error.message : 'Failed to provision managed project'
      await db
        .update(projects)
        .set({
          convexProject: {
            kind: 'failed',
            errorMessage,
          },
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in managed Convex connect API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
