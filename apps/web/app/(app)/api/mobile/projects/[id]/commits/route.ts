/**
 * Mobile API: Project Commits
 * GET /api/mobile/projects/[id]/commits - Get commit history
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects, commits } from '@flutter-vibe-code/database'
import { eq, and, desc } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/test-mode'

/**
 * GET /api/mobile/projects/[id]/commits
 * Get git commit history for project
 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch commits for this project
    const projectCommits = await db
      .select()
      .from(commits)
      .where(eq(commits.projectId, projectId))
      .orderBy(desc(commits.createdAt))
      .limit(50) // Limit to last 50 commits

    // Transform to mobile format (Version model)
    const versions = projectCommits.map((commit) => ({
      id: commit.id,
      message: commit.userMessage,
      timestamp: commit.createdAt?.toISOString(),
      commitId: commit.githubSHA,
      bundleUrl: commit.bundleUrl || null,
    }))

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('[Mobile API] Error fetching commits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
