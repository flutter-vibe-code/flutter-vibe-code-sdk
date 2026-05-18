import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/index'
import { db, spaceWaitlistSends, desc } from '@/lib/db'

export async function GET() {
  const session = await getServerSession()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sends = await db
    .select()
    .from(spaceWaitlistSends)
    .orderBy(desc(spaceWaitlistSends.sentAt))

  return NextResponse.json(sends)
}
