'use server'

import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import {
  getUserSubscriptionStatus,
  ensureUserSubscription,
} from '@flutter-vibe-code/payments/server'

export async function getSubscriptionStatus() {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user?.id) {
      return {
        hasSubscription: false,
        status: null,
        currentPlan: 'free',
        messageLimit: 10,
        messagesUsed: 0,
        resetDate: null,
      }
    }


    // Ensure subscription exists before checking status
    await ensureUserSubscription(session.user.id)

    // Directly call the function instead of making a fetch request
    const subscriptionStatus = await getUserSubscriptionStatus(session.user.id)


    return subscriptionStatus
  } catch (error) {
    console.error('[Server Action] Error in getSubscriptionStatus:', error)
    return {
      hasSubscription: false,
      status: null,
      currentPlan: 'free',
      messageLimit: 10,
      messagesUsed: 0,
      resetDate: null,
    }
  }
}
