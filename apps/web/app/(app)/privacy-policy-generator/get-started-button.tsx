'use client'

import { useRouter } from 'next/navigation'
import { useSession, signInWithGoogle } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'

export function GetStartedButton() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession()

  const handleGetStarted = () => {
    if (session) {
      router.push('/privacy-policy-generator/dashboard')
    } else {
      signInWithGoogle('/privacy-policy-generator/dashboard')
    }
  }

  return (
    <Button
      onClick={handleGetStarted}
      disabled={isSessionLoading}
      size="lg"
      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-full"
    >
      {isSessionLoading ? (
        'Loading...'
      ) : session ? (
        'Generate privacy policy'
      ) : (
        'Generate Your Policy'
      )}
    </Button>
  )
}
