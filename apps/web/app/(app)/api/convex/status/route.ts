// API endpoint to get Convex connection status for a project

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects, convexProjectCredentials } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 })
    }

    // Get project
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
      .limit(1)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const convexProject = project.convexProject as any

    console.log('[Convex Status] Project:', projectId, 'convexProject:', JSON.stringify(convexProject))

    // If not connected, return the state
    if (!convexProject || convexProject.kind !== 'connected') {
      console.log('[Convex Status] Not connected, returning:', { connected: false, state: convexProject || null })
      return NextResponse.json({
        connected: false,
        state: convexProject || null,
        devRunning: project.convexDevRunning || false,
      })
    }

    // Get credentials if connected
    const [credentials] = await db
      .select()
      .from(convexProjectCredentials)
      .where(eq(convexProjectCredentials.projectId, projectId))
      .limit(1)

    return NextResponse.json({
      connected: true,
      state: convexProject,
      credentials: credentials
        ? {
            mode: credentials.mode || 'oauth', // Include mode for UI differentiation
            teamSlug: credentials.teamSlug,
            projectSlug: credentials.projectSlug,
            deploymentUrl: credentials.deploymentUrl,
            deploymentName: credentials.deploymentName,
            // Don't send sensitive keys to client
          }
        : null,
      devRunning: project.convexDevRunning || false,
    })
  } catch (error) {
    console.error('Error in Convex status API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
