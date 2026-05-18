import { NextRequest, NextResponse } from 'next/server'
import { db, spaceWaitlist } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    await db
      .insert(spaceWaitlist)
      .values({ email: trimmed })
      .onConflictDoNothing()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Space Join] Error:', error?.message)
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    )
  }
}
