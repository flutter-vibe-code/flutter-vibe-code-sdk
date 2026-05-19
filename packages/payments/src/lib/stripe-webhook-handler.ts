import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeClient } from './stripe-client'
import { updateSubscription, cancelSubscription } from './subscription'
import type { PlanName } from '../types'

/**
 * Verify and construct a Stripe webhook event
 */
export async function constructWebhookEvent(
  payload: string,
  headers: Headers
): Promise<Stripe.Event> {
  const stripe = getStripeClient()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  const sig = headers.get('stripe-signature')!
  return stripe.webhooks.constructEvent(payload, sig, webhookSecret)
}

/**
 * Map Stripe price ID to plan name
 */
export function getPlanFromPriceId(priceId: string): PlanName {
  if (priceId === process.env.STRIPE_START_PRICE_ID) return 'start'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_SENIOR_PRICE_ID) return 'senior'
  return 'free'
}

/**
 * Get user ID from Stripe customer
 */
export async function getUserIdFromCustomer(stripe: Stripe, customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return (customer as Stripe.Customer).metadata?.user_id || null
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id
  if (!userId) {
    console.log('[Stripe Webhook] No user_id in checkout metadata')
    return
  }

  const subscriptionId = session.subscription as string
  const customerId = session.customer as string

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id
  const planName = priceId ? getPlanFromPriceId(priceId) : 'free'

  await updateSubscription(userId, {
    customerId,
    subscriptionId,
    planName,
    status: 'active',
    checkoutId: session.id,
  })

  console.log(`[Stripe Webhook] Checkout completed for user ${userId}, plan: ${planName}`)
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  const userId = await getUserIdFromCustomer(stripe, customerId)
  if (!userId) {
    console.log('[Stripe Webhook] No user_id for customer', customerId)
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planName = priceId ? getPlanFromPriceId(priceId) : 'free'

  if (subscription.status === 'canceled') {
    await cancelSubscription(userId)
    console.log(`[Stripe Webhook] Subscription cancelled for user ${userId}`)
    return
  }

  let status = 'inactive'
  if (subscription.status === 'active') status = 'active'
  else if (subscription.status === 'past_due') status = 'past_due'
  else if (subscription.status === 'trialing') status = 'active'

  await updateSubscription(userId, {
    customerId,
    subscriptionId: subscription.id,
    planName,
    status,
  })

  console.log(`[Stripe Webhook] Subscription updated for user ${userId}, status: ${status}, plan: ${planName}`)
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  const userId = await getUserIdFromCustomer(stripe, customerId)
  if (!userId) {
    console.log('[Stripe Webhook] No user_id for customer', customerId)
    return
  }

  await cancelSubscription(userId)
  console.log(`[Stripe Webhook] Subscription deleted for user ${userId}`)
}

/**
 * Main webhook handler
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  const stripe = getStripeClient()

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(stripe, event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(stripe, event.data.object as Stripe.Subscription)
      break

    case 'invoice.payment_failed':
      const invoice = event.data.object as Stripe.Invoice
      const failedCustomerId = invoice.customer as string
      const failedUserId = await getUserIdFromCustomer(stripe, failedCustomerId)
      if (failedUserId) {
        await updateSubscription(failedUserId, {
          status: 'past_due',
        })
        console.log(`[Stripe Webhook] Payment failed for user ${failedUserId}`)
      }
      break

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
  }
}
