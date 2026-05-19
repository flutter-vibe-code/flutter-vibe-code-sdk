import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

// Re-export from @flutter-vibe-code/auth for common types and utilities
export { getUserTeam, type UserTeam } from '@flutter-vibe-code/auth'

// Export Session type from better-auth
export type { Session } from 'better-auth/types'

// getServerSession needs local auth config
export async function getServerSession() {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })
  return session
}
