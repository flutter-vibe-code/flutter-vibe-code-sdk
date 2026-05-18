import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET

function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.error('GITHUB_WEBHOOK_SECRET is not configured')
    return false
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
  const digest = `sha256=${hmac.update(body).digest('hex')}`
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const event = request.headers.get('x-github-event')

    // Handle push events to main branch
    if (event === 'push' && payload.ref === 'refs/heads/main') {
      console.log('Push to main branch detected:', {
        repository: payload.repository.full_name,
        commits: payload.commits.length,
        pusher: payload.pusher.name,
        head_commit: payload.head_commit?.id
      })

      // Add your custom logic here for handling main branch pushes
      // For example:
      // - Trigger deployments
      // - Run tests
      // - Send notifications
      // - Update database records

      return NextResponse.json({ 
        message: 'Push to main processed successfully',
        processed: true 
      })
    }

    // Handle other events if needed
    console.log(`Received ${event} event for ${payload.repository?.full_name}`)

    return NextResponse.json({ 
      message: 'Webhook received',
      event: event,
      processed: false 
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}