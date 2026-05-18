import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }

    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    })
  }

  return stripeClient
}

export async function createCheckoutSession(
  priceId: string,
  customerId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const stripe = getStripeClient()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: customerId,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })

  return {
    checkoutUrl: session.url!,
    sessionId: session.id,
  }
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<{ portalUrl: string }> {
  const stripe = getStripeClient()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return {
    portalUrl: session.url,
  }
}

export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  const stripe = getStripeClient()

  const existing = await stripe.customers.search({
    query: `metadata['user_id']:'${userId}'`,
    limit: 1,
  })

  if (existing.data.length > 0) {
    return existing.data[0]
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      user_id: userId,
    },
  })

  return customer
}

export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripeClient()

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  })

  return subscriptions.data[0] || null
}

export { Stripe }
