import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, handleWebhookEvent } from '@flutter-vibe-code/payments/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const headers = request.headers

    const event = await constructWebhookEvent(payload, headers)

    await handleWebhookEvent(event)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
