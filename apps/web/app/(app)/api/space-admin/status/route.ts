import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/index'
import { db, spaceWaitlist, spaceWaitlistRecipients, eq } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const templateName = searchParams.get('template')

  if (!templateName) {
    return NextResponse.json({ error: 'template query param required' }, { status: 400 })
  }

  try {
    const allWaitlist = await db
      .select({ email: spaceWaitlist.email })
      .from(spaceWaitlist)

    const sentRecipients = await db
      .select({
        email: spaceWaitlistRecipients.email,
        sentAt: spaceWaitlistRecipients.sentAt,
      })
      .from(spaceWaitlistRecipients)
      .where(eq(spaceWaitlistRecipients.templateName, templateName))

    const sentEmails = new Set(sentRecipients.map((r) => r.email))

    const sent = sentRecipients.map((r) => ({
      email: r.email,
      sentAt: r.sentAt,
    }))

    const pending = allWaitlist
      .filter((w) => !sentEmails.has(w.email))
      .map((w) => ({ email: w.email }))

    return NextResponse.json({
      templateName,
      totalWaitlist: allWaitlist.length,
      sentCount: sent.length,
      pendingCount: pending.length,
      sent,
      pending,
    })
  } catch (error: any) {
    console.error('[Space Admin] Status error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Failed to get status' }, { status: 500 })
  }
}
