'use client'

import { createAuthClient } from 'better-auth/react'
import { polarClient } from '@polar-sh/better-auth'

// Get base URL - must match server configuration
const getBaseURL = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Use the current origin (protocol + host)
    return window.location.origin
  }
  // Fallback for SSR - this won't be used for OAuth
  return process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_PROD_URL || 'https://fluttervibecode.dpdns.org'
    : 'http://localhost:3210'
}

// Create Better Auth client
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        console.error('Too many requests. Please try again later.')
      }
      console.error('Auth error details:', e)
    },
  },
  plugins: [polarClient()],
})

// Export commonly used methods for convenience
export const signInWithGoogle = async (callbackURL?: string) => {
  const baseURL = getBaseURL()

  return await authClient.signIn.social({
    provider: 'google',
    callbackURL: callbackURL || baseURL,
    errorCallbackURL: baseURL,
  })
}

export const signOut = async () => {
  return await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = '/'
      },
    },
  })
}

// Export the hook properly
export const { useSession } = authClient
