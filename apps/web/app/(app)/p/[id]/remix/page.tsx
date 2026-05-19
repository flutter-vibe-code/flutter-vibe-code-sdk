'use client'

import { RemixPage } from '@flutter-vibe-code/remix/components'
import { signInWithGoogle, useSession } from '@/lib/auth/client'
import { useParams, useRouter } from 'next/navigation'

export default function RemixPageWrapper() {
  const params = useParams()
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession()
  const projectId = params?.id as string

  return (
    <RemixPage
      projectId={projectId}
      session={session}
      isSessionLoading={isSessionLoading}
      onSignIn={(callbackUrl) => signInWithGoogle(callbackUrl)}
      onNavigate={(path) => router.push(path)}
    />
  )
}
