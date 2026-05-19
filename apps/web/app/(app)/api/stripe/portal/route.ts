import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { createPortalSession } from '@flutter-vibe-code/payments/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const { portalUrl } = await createPortalSession(
      customerId,
      process.env.NEXT_PUBLIC_APP_URL || 'https://fluttervibecode.dpdns.org'
    )

    return NextResponse.json({ portalUrl })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
