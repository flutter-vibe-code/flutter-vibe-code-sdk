import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/index'
import { getSpaceTemplate } from '@/lib/email/templates/space-registry'
import { getResend, NEWSLETTER_FROM } from '@/lib/email'
import { isAdmin } from "@/lib/auth/admin"

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { templateName, testEmail } = body

  if (!templateName) {
    return NextResponse.json({ error: 'templateName is required' }, { status: 400 })
  }
  if (!testEmail) {
    return NextResponse.json({ error: 'testEmail is required' }, { status: 400 })
  }

  const template = getSpaceTemplate(templateName)
  if (!template) {
    return NextResponse.json({ error: `Template "${templateName}" not found` }, { status: 404 })
  }

  try {
    const Component = template.component
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: NEWSLETTER_FROM,
      to: testEmail,
      subject: `[TEST] ${template.subject}`,
      react: Component({}),
    })

    if (error) {
      console.error('[Space Admin] Test send error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, testEmail, templateName: template.name })
  } catch (error: any) {
    console.error('[Space Admin] Test send error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Failed to send test email' }, { status: 500 })
  }
}
