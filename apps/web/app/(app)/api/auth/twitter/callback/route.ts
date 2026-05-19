import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { twitterLinks } from '@flutter-vibe-code/database'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    const errorDescription = url.searchParams.get('error_description') || error
    return NextResponse.redirect(
      `${url.origin}/settings?error=${encodeURIComponent(errorDescription)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${url.origin}/settings?error=${encodeURIComponent('No authorization code provided')}`
    )
  }

  const cookieStore = await cookies()

  // Verify state for CSRF protection
  const storedState = cookieStore.get('twitter_link_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${url.origin}/settings?error=${encodeURIComponent('Invalid state parameter')}`
    )
  }

  // Get stored values from cookies
  const codeVerifier = cookieStore.get('twitter_link_code_verifier')?.value
  const userId = cookieStore.get('twitter_link_user_id')?.value

  if (!codeVerifier || !userId) {
    return NextResponse.redirect(
      `${url.origin}/settings?error=${encodeURIComponent('Session expired. Please try again.')}`
    )
  }

  // Clear cookies
  cookieStore.delete('twitter_link_code_verifier')
  cookieStore.delete('twitter_link_user_id')
  cookieStore.delete('twitter_link_state')

  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${url.origin}/settings?error=${encodeURIComponent('Server configuration error')}`
    )
  }

  // Build redirect URI (must match what was used in /link)
  const host = url.host
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const redirectUri = `${protocol}://${host}/api/auth/twitter/callback`

  try {
    // Exchange code for access token
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token'
    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    })

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: body.toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(
        `${url.origin}/settings?error=${encodeURIComponent('Failed to authenticate with Twitter')}`
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch Twitter user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.json()
      console.error('User fetch error:', errorData)
      return NextResponse.redirect(
        `${url.origin}/settings?error=${encodeURIComponent('Failed to fetch Twitter profile')}`
      )
    }

    const userData = await userResponse.json()
    const twitterUserId = userData.data.id
    const twitterUsername = userData.data.username

    // Check if this Twitter account is already linked to another user
    const existingLink = await db
      .select()
      .from(twitterLinks)
      .where(eq(twitterLinks.twitterUserId, twitterUserId))
      .limit(1)

    if (existingLink.length > 0 && existingLink[0].userId !== userId) {
      return NextResponse.redirect(
        `${url.origin}/settings?error=${encodeURIComponent('This Twitter account is already linked to another user')}`
      )
    }

    // Check if user already has a linked Twitter account
    const userExistingLink = await db
      .select()
      .from(twitterLinks)
      .where(eq(twitterLinks.userId, userId))
      .limit(1)

    if (userExistingLink.length > 0) {
      // Update existing link
      await db
        .update(twitterLinks)
        .set({
          twitterUserId,
          twitterUsername,
          linkedAt: new Date(),
        })
        .where(eq(twitterLinks.userId, userId))
    } else {
      // Create new link
      await db.insert(twitterLinks).values({
        userId,
        twitterUserId,
        twitterUsername,
      })
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${url.origin}/settings?success=${encodeURIComponent(`Successfully linked @${twitterUsername}`)}`
    )
  } catch (error) {
    console.error('Twitter link callback error:', error)
    return NextResponse.redirect(
      `${url.origin}/settings?error=${encodeURIComponent('An unexpected error occurred')}`
    )
  }
}
