import { NextRequest, NextResponse } from 'next/server'
import { getUserSubscriptionStatus } from '@/lib/usage-tracking'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { db, subscriptions } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { CONFIG } from '@/lib/config'
import { isAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// Helper to ensure user has subscription entry
async function ensureUserSubscription(userId: string) {
  try {
    const existingSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)

    if (existingSub.length === 0) {
      // Calculate reset date (1st of next month)
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      await db.insert(subscriptions).values({
        userId,
        currentPlan: 'free',
        status: 'inactive',
        messageLimit: CONFIG.FREE_PLAN_MESSAGE_LIMIT.toString(),
        resetDate: nextMonth,
        metadata: { createdVia: 'status-check' },
      })
      console.log('[Subscription Status API] Created default subscription for user:', userId)
      return true
    }
    return false
  } catch (error) {
    console.error('[Subscription Status API] Failed to ensure subscription:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin bypass: privileged emails always have an active premium subscription.
    if (isAdmin(session.user.email)) {
      return NextResponse.json({
        isSubscribed: true,
        hasSubscription: true,
        currentPlan: "admin",
        planName: "admin",
        status: "active",
        messageLimit: Number.MAX_SAFE_INTEGER,
        messagesUsed: 0,
        resetDate: null,
        subscribedAt: null,
        expiresAt: null,
        customerId: null,
      })
    }

    console.log('[Subscription Status API] User ID:', session.user.id)

    // Ensure subscription exists before checking status
    await ensureUserSubscription(session.user.id)

    const subscriptionStatus = await getUserSubscriptionStatus(session.user.id)
    console.log('[Subscription Status API] Status:', subscriptionStatus)

    return NextResponse.json(subscriptionStatus)
  } catch (error) {
    console.error('Error getting subscription status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}