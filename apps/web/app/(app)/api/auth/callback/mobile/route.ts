import { NextRequest, NextResponse } from 'next/server'

// Get the deep link URL for redirecting back to the Expo app
function getDeepLinkUrl(returnUrl?: string | null) {
  // If a return URL is provided (from the app), use it
  if (returnUrl) {
    return returnUrl
  }

  // Fallback: In development with Flutter, use the local network IP
  if (process.env.NODE_ENV === 'development') {
    // Use environment variable if available, otherwise default
    const expoDevUrl = process.env.EXPO_DEV_URL || 'exp://localhost:8081'
    return `${expoDevUrl}/--/auth-callback`
  }

  // Production fallback (should not reach here if return_url is passed)
  return 'exp://auth-callback'
}

/**
 * Mobile OAuth Callback Handler
 *
 * This endpoint receives the OAuth callback from Google and returns the authorization code
 * back to the Expo app via deep link. The Expo app then exchanges the code for tokens.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Extract the return URL from the state parameter
  let returnUrl: string | null = null
  if (state) {
    try {
      const stateData = JSON.parse(state)
      returnUrl = stateData.returnUrl || null
    } catch (e) {
      console.error('[Mobile OAuth] Failed to parse state:', e)
    }
  }

  console.log('[Mobile OAuth] Callback received:', {
    hasCode: !!code,
    codeLength: code?.length,
    state,
    error,
    returnUrl,
    fullUrl: request.url,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    origin: request.nextUrl.origin,
    allParams: Object.fromEntries(searchParams.entries()),
    headers: {
      host: request.headers.get('host'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    }
  })

  // Handle OAuth errors
  if (error) {
    console.error('[Mobile OAuth] OAuth error:', error)
    const deepLinkUrl = getDeepLinkUrl(returnUrl)
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Authentication Error</title></head>
        <body>
          <h1>Authentication Error</h1>
          <p>${error}</p>
          <script>
            setTimeout(() => {
              window.location.href = '${deepLinkUrl}?error=${encodeURIComponent(error)}';
            }, 1000);
          </script>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!code) {
    console.error('[Mobile OAuth] No authorization code received')
    console.error('[Mobile OAuth] Search params:', Object.fromEntries(searchParams.entries()))
    const deepLinkUrl = getDeepLinkUrl(returnUrl)
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Authentication Error</title></head>
        <body>
          <h1>Authentication Error</h1>
          <p>No authorization code received</p>
          <p style="color: #666; font-size: 12px;">Check server logs for details</p>
          <script>
            setTimeout(() => {
              window.location.href = '${deepLinkUrl}?error=no_code';
            }, 1000);
          </script>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  // Return the authorization code back to the Expo app via deep link
  // The Expo app will handle the token exchange
  console.log('[Mobile OAuth] Redirecting to Expo app with code')
  const deepLinkUrl = getDeepLinkUrl(returnUrl)

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head><title>Authentication Successful</title></head>
      <body>
        <h1>Sign in successful!</h1>
        <p>Returning to app...</p>
        <script>
          // Redirect back to the Expo app with the authorization code
          window.location.href = '${deepLinkUrl}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}';
        </script>
      </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
