import { NextRequest, NextResponse } from 'next/server'
import { Polar } from '@polar-sh/sdk'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SERVER! as 'production' | 'sandbox',
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Create checkout session
    const checkout = await polarClient.checkouts.create({
      products: [process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID!],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success?checkout_id={CHECKOUT_ID}`,
      customerEmail: session.user.email,
    })

    if (checkout.url) {
      return NextResponse.redirect(checkout.url)
    }

    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 400 })
  } catch (error) {
    console.error('Error creating checkout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}