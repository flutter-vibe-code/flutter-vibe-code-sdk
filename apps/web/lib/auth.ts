'use client'

import { useSession } from './auth/client'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

// Better Auth session structure
export interface Session {
  user: {
    id: string
    email: string
    name: string
    image?: string | null
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  }
  session: {
    id: string
    token: string
    userId: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    ipAddress?: string | null
    userAgent?: string | null
  }
}

export interface UserTeam {
  id: string
  name: string
  email: string
  tier: string
}

export function useAuth() {
  const { data: session, isPending: loading } = useSession()
  const posthog = usePostHog()

  useEffect(() => {
    if (session?.user) {
      // Analytics tracking
      posthog.identify(session.user.id, {
        email: session.user.email,
        user_id: session.user.id,
      })
    }
  }, [session, posthog])

  return {
    session,
    userTeam: null, // TODO: Implement user team functionality
    loading,
  }
}
