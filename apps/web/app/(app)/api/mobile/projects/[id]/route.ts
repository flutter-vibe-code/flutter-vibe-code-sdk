/**
 * Mobile API: Individual Project
 * GET    /api/mobile/projects/[id] - Get project details
 * PATCH  /api/mobile/projects/[id] - Update project
 * DELETE /api/mobile/projects/[id] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/test-mode'

/**
 * GET /api/mobile/projects/[id]
 * Fetch single project details
 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id

    // Fetch project with ownership check
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Transform to mobile format
    const mobileProject = {
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
      deployedUrl: project.deployedUrl || null,
      staticBundleUrl: project.staticBundleUrl || null,
      githubSHA: project.githubSHA || null,
    }

    return NextResponse.json({ project: mobileProject })
  } catch (error) {
    console.error('[Mobile API] Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/mobile/projects/[id]
 * Update project (rename, publish status, etc.)
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const body = await req.json()

    // Check project exists and belongs to user
    const [existingProject] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1)

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date(),
    }

    if (body.name !== undefined) {
      updates.title = body.name
    }

    if (body.isPublished !== undefined) {
      updates.isPublished = body.isPublished
    }

    if (body.iconUrl !== undefined) {
      updates.iconUrl = body.iconUrl
    }

    // Perform update
    const [updatedProject] = await db
      .update(projects)
      .set(updates)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning()

    // Return updated project in mobile format
    const mobileProject = {
      id: updatedProject.id,
      name: updatedProject.title,
      updatedAt: updatedProject.updatedAt?.toISOString(),
      isPublished: updatedProject.isPublished || false,
      iconUrl: updatedProject.iconUrl || null,
    }

    return NextResponse.json({ project: mobileProject })
  } catch (error) {
    console.error('[Mobile API] Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mobile/projects/[id]
 * Delete project and cleanup resources
 */
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id

    // Check project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Cleanup E2B sandbox if active
    // TODO: Cleanup Vercel Blob bundles

    // Delete project (cascade will delete related records)
    await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Mobile API] Error deleting project:', error)
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
      return 'UPDATING'
    case 'completed':
      return 'ACTIVE'
    case 'error':
      return 'ERROR'
    default:
      return 'CREATING'
  }
}

/**
 * Map sandbox status to mobile format
 */
function mapSandboxStatus(status: string | null): string | null {
  if (!status) return null

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
