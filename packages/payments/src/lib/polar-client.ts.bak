import { Polar } from '@polar-sh/sdk'

let polarClient: Polar | null = null

/**
 * Get or create the Polar SDK client
 * This is a singleton to avoid creating multiple instances
 */
export function getPolarClient(): Polar {
  if (!polarClient) {
    if (!process.env.POLAR_ACCESS_TOKEN) {
      throw new Error('POLAR_ACCESS_TOKEN environment variable is required')
    }

    polarClient = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: (process.env.POLAR_SERVER as 'production' | 'sandbox') || 'production',
    })
  }

  return polarClient
}

/**
 * Create a checkout session for a product
 */
export async function createCheckoutSession(
  productId: string,
  customerId: string,
  successUrl: string,
  metadata?: Record<string, string>
): Promise<{ checkoutUrl: string }> {
  const polar = getPolarClient()

  const checkout = await (polar.checkouts as any).custom.create({
    productId,
    successUrl,
    customerExternalId: customerId,
    metadata,
  })

  return {
    checkoutUrl: checkout.url,
  }
}

/**
 * Create a customer portal session
 */
export async function createPortalSession(
  customerId: string
): Promise<{ portalUrl: string }> {
  const polar = getPolarClient()

  // First, try to find the customer by external ID
  const customers = await polar.customers.list({
    externalId: customerId,
  } as any)

  if (!customers.result.items.length) {
    throw new Error('Customer not found')
  }

  const customer = customers.result.items[0]

  const portal = await (polar.customerPortal as any).sessions.create({
    customerId: customer.id,
  })

  return {
    portalUrl: portal.customerPortalUrl,
  }
}

/**
 * Get customer by external ID
 */
export async function getCustomerByExternalId(externalId: string) {
  const polar = getPolarClient()

  const customers = await polar.customers.list({
    externalId,
  } as any)

  return customers.result.items[0] || null
}

/**
 * Create a customer if they don't exist
 */
export async function ensureCustomer(
  externalId: string,
  email: string,
  name?: string
) {
  const polar = getPolarClient()

  // Check if customer exists
  const existing = await getCustomerByExternalId(externalId)
  if (existing) {
    return existing
  }

  // Create new customer
  const customer = await polar.customers.create({
    externalId,
    email,
    name,
  })

  return customer
}

export { Polar }
