import { sendWelcomeEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

// Test endpoint - only available in development
// Usage: GET /api/test-email?email=your@email.com&name=Your%20Name
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const name = searchParams.get('name') || 'Test User'

  if (!email) {
    return NextResponse.json(
      { error: 'Missing email parameter. Usage: /api/test-email?email=your@email.com&name=Your%20Name' },
      { status: 400 }
    )
  }

  try {
    const result = await sendWelcomeEmail({ name, email })
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('[Test Email] Error:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error?.message || error?.name || JSON.stringify(error),
        fullError: error
      },
      { status: 500 }
    )
  }
}
