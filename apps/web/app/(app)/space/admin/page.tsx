import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/index'
import { SpaceAdminPanel } from './space-admin-panel'

export const dynamic = 'force-dynamic'

export default async function SpaceAdminPage() {
  const session = await getServerSession()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    redirect('/')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <SpaceAdminPanel />
      </div>
    </main>
  )
}
