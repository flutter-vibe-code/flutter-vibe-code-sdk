import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { getMessageLimitForPlan, getNextResetDate } from './config'
import type { PolarWebhookEventType, PlanName } from '../types'

export { WebhookVerificationError }

/**
 * Verify and parse a Polar webhook event
 */
export async function verifyWebhookEvent(
  payload: string,
  headers: {
    'webhook-id': string
    'webhook-timestamp': string
    'webhook-signature': string
  }
) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('POLAR_WEBHOOK_SECRET environment variable is required')
  }

  const event = validateEvent(payload, headers, webhookSecret)
  return event
}

/**
 * Extract plan name from product name
 */
export function extractPlanFromProductName(productName: string): PlanName {
  const name = productName.toLowerCase()
  if (name.includes('senior')) return 'senior'
  if (name.includes('pro')) return 'pro'
  if (name.includes('start')) return 'start'
  return 'free'
}

/**
 * Map product ID to plan name
 */
export function getPlanFromProductId(productId: string): PlanName {
  if (productId === process.env.NEXT_PUBLIC_POLAR_SENIOR_PRODUCT_ID) return 'senior'
  if (productId === process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID) return 'pro'
  if (productId === process.env.NEXT_PUBLIC_POLAR_START_PRODUCT_ID) return 'start'
  return 'free'
}

/**
 * Get subscription update data from checkout event
 */
export function getSubscriptionDataFromCheckout(checkout: any) {
  const productId = checkout.productId
  const planName = getPlanFromProductId(productId)
  const messageLimit = getMessageLimitForPlan(planName)

  return {
    subscriptionId: checkout.subscriptionId,
    productId,
    planName,
    messageLimit: messageLimit.toString(),
    status: 'active' as const,
    checkoutId: checkout.id,
    subscribedAt: new Date(),
    resetDate: getNextResetDate(),
  }
}

/**
 * Get subscription update data from subscription event
 */
export function getSubscriptionDataFromSubscription(subscription: any) {
  const productId = subscription.product?.id || subscription.productId
  const productName = subscription.product?.name || ''
  const planName = productId ? getPlanFromProductId(productId) : extractPlanFromProductName(productName)
  const messageLimit = getMessageLimitForPlan(planName)

  return {
    subscriptionId: subscription.id,
    productId,
    planName,
    messageLimit: messageLimit.toString(),
    status: subscription.status || 'active',
    resetDate: getNextResetDate(),
  }
}

// Re-export for convenience
export { getMessageLimitForPlan, getNextResetDate }
