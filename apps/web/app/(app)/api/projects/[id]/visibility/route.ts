import { db } from '@/lib/db'
import { projects, subscriptions } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'
import { NextRequest } from 'next/server'

/**
 * PATCH /api/projects/[id]/visibility
 * Toggle project visibility (public/private)
 * Requires authentication and project ownership
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await req.json()
    const { isPublic, userID } = body

    if (!userID) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
      })
    }

    if (typeof isPublic !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'isPublic must be a boolean' }),
        { status: 400 }
      )
    }

    // Check if project exists and belongs to user
    const existingProject = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, params.id), eq(projects.userId, userID)))
      .limit(1)

    if (existingProject.length === 0) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
      })
    }

    // If user wants to make project private, check if they have a paid subscription
    if (!isPublic) {
      const userSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userID))
        .limit(1)

      // Free users cannot make projects private
      if (
        userSubscription.length === 0 ||
        userSubscription[0].currentPlan === 'free' ||
        userSubscription[0].status !== 'active'
      ) {
        return new Response(
          JSON.stringify({
            error:
              'Upgrade to a paid plan to make projects private. Free plan projects are public by default.',
            requiresUpgrade: true,
          }),
          { status: 403 }
        )
      }
    }

    // Update project visibility
    const updatedProject = await db
      .update(projects)
      .set({
        isPublic,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, params.id), eq(projects.userId, userID)))
      .returning()

    return new Response(
      JSON.stringify({
        success: true,
        project: updatedProject[0],
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating project visibility:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to update project visibility',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    )
  }
}
