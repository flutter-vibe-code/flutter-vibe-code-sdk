import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { createCheckoutSession, getOrCreateCustomer } from '@flutter-vibe-code/payments/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, planName } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(
      session.user.id,
      session.user.email!,
      session.user.name || undefined
    )

    // Create checkout session
    const { checkoutUrl, sessionId } = await createCheckoutSession(
      priceId,
      customer.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=success`,
      `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=cancelled`,
      {
        user_id: session.user.id,
        plan_name: planName,
      }
    )

    return NextResponse.json({
      checkoutUrl,
      sessionId,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
