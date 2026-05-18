import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/index'
import { db, user, emailPreferences, newsletterSends, newsletterRecipients, eq, sql } from '@/lib/db'
import { getResend, NEWSLETTER_FROM } from '@/lib/email'
import { getTemplate } from '@/lib/email/templates/registry'
import { getUnsubscribeUrl } from '@/lib/email/unsubscribe'
import { isAdmin } from "@/lib/auth/admin"

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { templateName } = body

  if (!templateName) {
    return NextResponse.json({ error: 'templateName is required' }, { status: 400 })
  }

  const template = getTemplate(templateName)
  if (!template) {
    return NextResponse.json({ error: `Template "${templateName}" not found` }, { status: 404 })
  }

  try {
    // Get users who already received this specific newsletter
    const alreadySent = await db
      .select({ userId: newsletterRecipients.userId })
      .from(newsletterRecipients)
      .where(eq(newsletterRecipients.templateName, templateName))

    const alreadySentUserIds = alreadySent.map((r) => r.userId)

    // Get subscribed users who haven't received this newsletter yet
    const subscribedUsers = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .leftJoin(emailPreferences, eq(user.id, emailPreferences.userId))
      .where(
        sql`(${emailPreferences.subscribedToNewsletter} IS NULL OR ${emailPreferences.subscribedToNewsletter} = true)`
      )

    const pendingUsers = alreadySentUserIds.length > 0
      ? subscribedUsers.filter((u) => !alreadySentUserIds.includes(u.id))
      : subscribedUsers

    if (pendingUsers.length === 0) {
      return NextResponse.json({
        error: 'All subscribed users have already received this newsletter',
        totalSubscribed: subscribedUsers.length,
        alreadySent: alreadySentUserIds.length,
      }, { status: 400 })
    }

    const Component = template.component
    const resend = getResend()

    // Resend batch API supports up to 100 emails per call, so chunk
    const results = []
    for (let i = 0; i < pendingUsers.length; i += 100) {
      const chunk = pendingUsers.slice(i, i + 100)
      const emails = chunk.map((u) => ({
        from: NEWSLETTER_FROM,
        to: u.email,
        subject: template.subject,
        react: Component({
          issueNumber: template.issueNumber,
          issueDate: template.issueDate,
          unsubscribeUrl: getUnsubscribeUrl(u.email),
        }),
      }))

      const { data, error } = await resend.batch.send(emails)
      if (error) {
        console.error('[Email Admin] Batch send error:', JSON.stringify(error))
        // Record the recipients we already sent to before the error
        if (i > 0) {
          const sentSoFar = pendingUsers.slice(0, i)
          await db.insert(newsletterRecipients).values(
            sentSoFar.map((u) => ({ templateName, userId: u.id, email: u.email }))
          )
        }
        return NextResponse.json({
          error: (error as any).message || 'Resend batch send failed',
          sentBeforeError: i,
        }, { status: 500 })
      }
      results.push(data)
    }

    // Record all recipients
    await db.insert(newsletterRecipients).values(
      pendingUsers.map((u) => ({ templateName, userId: u.id, email: u.email }))
    )

    // Record the send in history
    await db.insert(newsletterSends).values({
      templateName: template.name,
      subject: template.subject,
      recipientCount: pendingUsers.length,
      sentBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      sentCount: pendingUsers.length,
      totalSubscribed: subscribedUsers.length,
      alreadySent: alreadySentUserIds.length,
    })
  } catch (error: any) {
    console.error('[Email Admin] Send error:', error?.message, error?.stack)
    return NextResponse.json(
      { error: error?.message || 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
