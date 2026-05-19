/**
 * Mobile API: Subscription Status
 * GET /api/mobile/subscription/status - Get user's subscription status
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subscriptions, promptMessages } from '@flutter-vibe-code/database'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { CONFIG } from '@/lib/config'

/**
 * GET /api/mobile/subscription/status
 * Get subscription status and usage
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1)

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const [usage] = await db
      .select()
      .from(promptMessages)
      .where(eq(promptMessages.userId, session.user.id))
      .where(eq(promptMessages.month, currentMonth))
      .limit(1)

    const currentUsage = parseInt(usage?.usageCount || '0')

    // Determine message limit based on plan
    const messageLimit = subscription
      ? parseInt(subscription.messageLimit || '0')
      : parseInt(CONFIG.FREE_PLAN_MESSAGE_LIMIT)

    const status = {
      isActive: subscription?.status === 'active',
      currentPlan: subscription?.currentPlan || 'free',
      messageLimit,
      messagesUsed: currentUsage,
      messagesRemaining: Math.max(0, messageLimit - currentUsage),
      resetDate: subscription?.resetDate?.toISOString() || getNextMonthFirst(),
      status: subscription?.status || 'inactive',
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('[Mobile API] Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get first day of next month as ISO string
 */
function getNextMonthFirst(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth.toISOString()
}
