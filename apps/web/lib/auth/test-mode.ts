/**
 * Test Mode Authentication Helper
 *
 * Allows mobile app to bypass authentication for testing purposes
 * by using a hardcoded test user ID.
 */

import { headers } from 'next/headers'

const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-default'
const TEST_MODE_PREFIX = 'test-user-'

export interface TestModeSession {
  user: {
    id: string
    email: string
    name: string
  }
  isTestMode: true
}

/**
 * Check if the request is in test mode and return a mock session
 * @returns Test mode session if test mode detected, null otherwise
 */
export async function getTestModeSession(): Promise<TestModeSession | null> {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')


  if (!authHeader) {
    return null
  }

  // Check if authorization header contains test mode token
  const token = authHeader.replace('Bearer ', '')

  if (token.startsWith(TEST_MODE_PREFIX)) {
    const userId = token.replace(TEST_MODE_PREFIX, '')

    // Verify the user ID matches our test user
    if (userId === TEST_USER_ID) {

      return {
        user: {
          id: TEST_USER_ID,
          email: 'test@capsule.dev',
          name: 'Test User',
        },
        isTestMode: true,
      }
    }
  }

  return null
}

/**
 * Check if test mode is enabled in the environment
 */
export function isTestModeEnabled(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_MODE === 'true'
}

/**
 * Get authenticated user ID, supporting both test mode and regular auth
 * @returns User ID if authenticated, null otherwise
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  // Check test mode first
  if (isTestModeEnabled()) {
    const testSession = await getTestModeSession()
    if (testSession) {
      return testSession.user.id
    }
  }

  // Fall back to regular auth
  const { auth } = await import('@/lib/auth/config')
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  return session?.user?.id || null
}
