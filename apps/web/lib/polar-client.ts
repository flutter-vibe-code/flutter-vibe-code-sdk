'use client'

/**
 * @deprecated This file is deprecated. Import from '@flutter-vibe-code/payments/client' instead.
 * This file is kept for backwards compatibility during migration.
 */

import { authClient, useSession } from '@/lib/auth/client'
import { createPolarUtils, useSubscriptionStatusBase } from '@flutter-vibe-code/payments/client'

// Create polarUtils with the authClient
export const polarUtils = createPolarUtils({
  authClient: authClient as any,
})

// Hook to get subscription status - uses the auth client from this app
export function useSubscriptionStatus() {
  const { data: session } = useSession()

  return useSubscriptionStatusBase({
    authClient: authClient as any,
    session,
  })
}
