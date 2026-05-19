/**
 * Mobile API: Projects
 * GET  /api/mobile/projects - List user's projects
 * POST /api/mobile/projects - Generate new app
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@flutter-vibe-code/database'
import { eq, desc } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/test-mode'

/**
 * GET /api/mobile/projects
 * List all projects for authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Mobile API] Using test mode for user:', userId)

    // Fetch user's projects, ordered by most recently updated
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt))
      .limit(100)

    // Transform to mobile-compatible format
    const mobileProjects = userProjects.map((project) => ({
      id: project.id,
      name: project.title,
      createdAt: project.createdAt?.toISOString(),
      updatedAt: project.updatedAt?.toISOString(),
      status: mapProjectStatus(project.status),
      sandboxStatus: mapSandboxStatus(project.sandboxStatus),
      sshActive: project.sshActive || false,
      isPublished: project.isPublished || false,
      iconUrl: project.iconUrl || null,
      e2bUrl: project.e2bUrl || null,
      sandboxId: project.sandboxId || null,
    }))

    return NextResponse.json({ projects: mobileProjects })
  } catch (error) {
    console.error('[Mobile API] Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mobile/projects
 * Generate new app from prompt
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Mobile API] Using test mode for user:', userId)

    const body = await req.json()
    const { message, mode = 'auto', model = 'sonnet', imageUrl, integrationType } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Import dynamically to avoid circular dependencies
    const { createContainer } = await import('@/app/(app)/api/create-container/route')

    // Create sandbox and start generation
    // This will trigger the same flow as the web app
    const result = await createContainer(req, {
      userId: userId,
      prompt: message,
      template: 'expo', // Default to expo template
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      projectId: result.projectId,
    })
  } catch (error) {
    console.error('[Mobile API] Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Map internal project status to mobile app status format
 */
function mapProjectStatus(status: string | null): string {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'paused':
      return 'CREATING' // or 'UPDATING' depending on context
    case 'completed':
      return 'ACTIVE'
    case 'error':
      return 'ERROR'
    default:
      return 'CREATING'
  }
}

/**
 * Map internal sandbox status to mobile app format
 */
function mapSandboxStatus(status: string | null): string | null {
  if (!status) {
    return null
  }

  switch (status.toLowerCase()) {
    case 'active':
      return 'ACTIVE'
    case 'paused':
      return 'PAUSED'
    case 'destroyed':
      return 'DESTROYED'
    default:
      return null
  }
}
