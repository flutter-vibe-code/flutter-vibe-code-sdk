// API endpoint to connect a project to Convex
// Provisions a new Convex project and stores credentials

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects, convexProjectCredentials } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'
import { provisionConvexProject } from '@/lib/convex/provisioning'
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
    const { projectId, teamSlug, projectName, accessToken } = body

    if (!projectId || !teamSlug || !projectName || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, teamSlug, projectName, accessToken' },
        { status: 400 }
      )
    }

    const clientId = process.env.CONVEX_OAUTH_CLIENT_ID
    const clientSecret = process.env.CONVEX_OAUTH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Convex OAuth not configured' }, { status: 500 })
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

    // Update project state to "connecting"
    await db
      .update(projects)
      .set({
        convexProject: { kind: 'connecting' },
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    try {
      // Provision the Convex project
      const convexProject = await provisionConvexProject({
        accessToken,
        teamSlug,
        projectName,
        clientId,
        clientSecret,
      })

      // Store credentials
      await db.insert(convexProjectCredentials).values({
        projectId,
        userId: session.user.id,
        teamSlug: convexProject.teamSlug,
        projectSlug: convexProject.projectSlug,
        deploymentUrl: convexProject.deploymentUrl,
        deploymentName: convexProject.deploymentName,
        adminKey: convexProject.token,
        accessToken,
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
      })
    } catch (error) {
      console.error('Failed to provision Convex project:', error)

      // Update project state to "failed"
      const errorMessage = error instanceof Error ? error.message : 'Failed to provision project'
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
    console.error('Error in Convex connect API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
