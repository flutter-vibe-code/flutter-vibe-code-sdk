// Server utilities
export { getUserTeam, getAuthHeaders, type UserTeam } from './server'

// Client utilities (re-exported for convenience)
export {
  authClient,
  signInWithGoogle,
  signOut,
  useSession,
} from './client'
