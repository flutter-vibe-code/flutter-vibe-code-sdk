import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/index'
import { db, spaceWaitlist, spaceWaitlistSends, spaceWaitlistRecipients, eq } from '@/lib/db'
import { getResend, NEWSLETTER_FROM } from '@/lib/email'
import { getSpaceTemplate } from '@/lib/email/templates/space-registry'
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

  const template = getSpaceTemplate(templateName)
  if (!template) {
    return NextResponse.json({ error: `Template "${templateName}" not found` }, { status: 404 })
  }

  try {
    // Get all waitlist emails
    const allWaitlist = await db
      .select({ email: spaceWaitlist.email })
      .from(spaceWaitlist)

    // Get already-sent for this template
    const alreadySent = await db
      .select({ email: spaceWaitlistRecipients.email })
      .from(spaceWaitlistRecipients)
      .where(eq(spaceWaitlistRecipients.templateName, templateName))

    const sentEmails = new Set(alreadySent.map((r) => r.email))
    const pendingEmails = allWaitlist.filter((w) => !sentEmails.has(w.email))

    if (pendingEmails.length === 0) {
      return NextResponse.json({
        error: 'All waitlist subscribers have already received this email',
        totalWaitlist: allWaitlist.length,
        alreadySent: sentEmails.size,
      }, { status: 400 })
    }

    const Component = template.component
    const resend = getResend()

    // Send in batches of 100
    for (let i = 0; i < pendingEmails.length; i += 100) {
      const chunk = pendingEmails.slice(i, i + 100)
      const emails = chunk.map((w) => ({
        from: NEWSLETTER_FROM,
        to: w.email,
        subject: template.subject,
        react: Component({}),
      }))

      const { error } = await resend.batch.send(emails)
      if (error) {
        console.error('[Space Admin] Batch send error:', JSON.stringify(error))
        return NextResponse.json({
          error: (error as any).message || 'Resend batch send failed',
          sentBeforeError: i,
        }, { status: 500 })
      }
    }

    // Record recipients
    await db.insert(spaceWaitlistRecipients).values(
      pendingEmails.map((w) => ({ templateName, email: w.email }))
    )

    // Record send history
    await db.insert(spaceWaitlistSends).values({
      templateName: template.name,
      subject: template.subject,
      recipientCount: pendingEmails.length,
      sentBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      sentCount: pendingEmails.length,
      totalWaitlist: allWaitlist.length,
    })
  } catch (error: any) {
    console.error('[Space Admin] Send error:', error?.message, error?.stack)
    return NextResponse.json(
      { error: error?.message || 'Failed to send' },
      { status: 500 }
    )
  }
}
