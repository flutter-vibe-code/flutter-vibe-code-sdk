import { db, usersTeams, eq } from '@flutter-vibe-code/database'
import { headers } from 'next/headers'

// Note: auth is imported dynamically to avoid circular dependencies
// The actual auth configuration should be imported from the app

export type UserTeam = {
  id: string
  name: string
  email: string
  tier: string
}

export async function getUserTeam(userId: string): Promise<UserTeam | null> {
  const userTeam = await db.query.usersTeams.findFirst({
    where: eq(usersTeams.userId, userId),
    with: {
      team: true,
    },
  })

  if (!userTeam || !userTeam.team) return null

  return {
    id: userTeam.team.id,
    name: userTeam.team.name,
    email: userTeam.team.email,
    tier: userTeam.team.tier || 'free',
  }
}

// Helper to get headers for auth - must be called from server context
export async function getAuthHeaders() {
  return await headers()
}
