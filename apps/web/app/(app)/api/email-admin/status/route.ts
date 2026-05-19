import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/index'
import { db, user, emailPreferences, newsletterRecipients, eq, sql } from '@/lib/db'
import { isAdmin } from "@/lib/auth/admin"

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const templateName = searchParams.get('template')

  if (!templateName) {
    return NextResponse.json({ error: 'template query param required' }, { status: 400 })
  }

  try {
    // Total subscribed users
    const subscribedUsers = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .leftJoin(emailPreferences, eq(user.id, emailPreferences.userId))
      .where(
        sql`(${emailPreferences.subscribedToNewsletter} IS NULL OR ${emailPreferences.subscribedToNewsletter} = true)`
      )

    // Users who already received this newsletter
    const sentRecipients = await db
      .select({
        userId: newsletterRecipients.userId,
        email: newsletterRecipients.email,
        sentAt: newsletterRecipients.sentAt,
      })
      .from(newsletterRecipients)
      .where(eq(newsletterRecipients.templateName, templateName))

    const sentUserIds = new Set(sentRecipients.map((r) => r.userId))

    const sent = sentRecipients.map((r) => ({
      email: r.email,
      sentAt: r.sentAt,
    }))

    const pending = subscribedUsers
      .filter((u) => !sentUserIds.has(u.id))
      .map((u) => ({ email: u.email, name: u.name }))

    return NextResponse.json({
      templateName,
      totalSubscribed: subscribedUsers.length,
      sentCount: sent.length,
      pendingCount: pending.length,
      sent,
      pending,
    })
  } catch (error: any) {
    console.error('[Email Admin] Status error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Failed to get status' }, { status: 500 })
  }
}
