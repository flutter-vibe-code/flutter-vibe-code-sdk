// OAuth flow initiation route
// Redirects to Convex OAuth authorization page

import { NextResponse } from 'next/server'
import { getOAuthAuthorizeUrl } from '@/lib/convex/provisioning'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const clientId = process.env.CONVEX_OAUTH_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'CONVEX_OAUTH_CLIENT_ID not configured' }, { status: 500 })
  }

  // Get optional state parameter (can be used to pass project ID)
  const state = searchParams.get('state') || undefined
  // Use explicit base URL if set, otherwise fall back to detected origin
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || origin
  const redirectUri = `${baseUrl}/convex/callback`

  console.log('[Convex OAuth] Origin:', origin)
  console.log('[Convex OAuth] Base URL used:', baseUrl)
  console.log('[Convex OAuth] Redirect URI:', redirectUri)

  const authorizeUrl = getOAuthAuthorizeUrl({
    clientId,
    redirectUri,
    state,
  })

  // Redirect to Convex OAuth page
  return NextResponse.redirect(authorizeUrl)
}
