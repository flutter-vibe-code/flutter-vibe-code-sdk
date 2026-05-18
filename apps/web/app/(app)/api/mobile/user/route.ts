/**
 * Mobile API: User Data
 * GET /api/mobile/user - Get authenticated user data
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subscriptions, user as userTable } from '@flutter-vibe-code/database'
import { eq } from 'drizzle-orm'
import { getAuthenticatedUserId } from '@/lib/auth/test-mode'

/**
 * GET /api/mobile/user
 * Get current user data including subscription
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Mobile API] Using test mode for user:', userId)

    // Get user details from database
    const [dbUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
    }

    // Get user's subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    // Map plan tier to mobile format
    const planTier = mapPlanTier(subscription?.currentPlan || 'free')

    // Build user data response
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.name?.split(' ')[0] || null,
      lastName: user.name?.split(' ').slice(1).join(' ') || null,
      isAdmin: false, // TODO: Add admin field to user table if needed
      planTier,
      creditBalance: null, // TODO: Implement credit system if needed
      lastLedgerId: null, // Not implemented yet
      subscription: null, // Subscription details not needed for test mode
      paygoEnabled: false, // Not implemented yet
      paygoPriceId: null, // Not implemented yet
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error('[Mobile API] Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Map plan tier to mobile format
 */
function mapPlanTier(plan: string): string {
  switch (plan.toLowerCase()) {
    case 'free':
      return 'FREE'
    case 'start':
      return 'PLUS'
    case 'pro':
      return 'PRO'
    case 'senior':
      return 'MAX'
    default:
      return 'FREE'
  }
}
