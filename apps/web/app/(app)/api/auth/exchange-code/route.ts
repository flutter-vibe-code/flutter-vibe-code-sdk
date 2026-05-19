import { NextRequest, NextResponse } from 'next/server'
import { db, user, account } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return handleCorsOptions()
}

/**
 * Exchange Google OAuth authorization code for tokens
 *
 * This endpoint receives the authorization code from the Expo app
 * and exchanges it with Google for access and ID tokens.
 * Also creates/finds the user in the database to match Better Auth behavior.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, redirectUri, codeVerifier } = body

    console.log('[Exchange Code] Request received:', {
      hasCode: !!code,
      codeLength: code?.length,
      redirectUri,
      hasCodeVerifier: !!codeVerifier,
      codeVerifierLength: codeVerifier?.length,
    })

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'Redirect URI is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!codeVerifier) {
      return NextResponse.json(
        { error: 'Code verifier is required for PKCE' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Exchange the code for tokens with Google using PKCE
    const tokenParams: Record<string, string> = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }

    // Only include client_secret for web apps (not needed for PKCE mobile apps)
    if (process.env.GOOGLE_CLIENT_SECRET) {
      tokenParams.client_secret = process.env.GOOGLE_CLIENT_SECRET
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams),
    })

    console.log('[Exchange Code] Google token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Exchange Code] Google token exchange failed:', errorText)
      console.error('[Exchange Code] Request details:', {
        redirect_uri: redirectUri,
        client_id: process.env.GOOGLE_CLIENT_ID,
        has_client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
        code_length: code.length,
      })
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens', details: errorText },
        { status: tokenResponse.status, headers: corsHeaders }
      )
    }

    const tokens = await tokenResponse.json()
    console.log('[Exchange Code] Received tokens from Google')

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      const error = await userInfoResponse.text()
      console.error('[Exchange Code] Failed to fetch user info:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user info' },
        { status: userInfoResponse.status, headers: corsHeaders }
      )
    }

    const userInfo = await userInfoResponse.json()
    console.log('[Exchange Code] User info from Google:', {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
    })

    // Find or create user in database (matching Better Auth behavior)
    let dbUser = await db
      .select()
      .from(user)
      .where(eq(user.email, userInfo.email))
      .limit(1)

    if (dbUser.length === 0) {
      // Create new user
      console.log('[Exchange Code] Creating new user in database')
      const newUsers = await db
        .insert(user)
        .values({
          id: `google_${userInfo.id}`, // Use Google ID with prefix to match Better Auth pattern
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          emailVerified: true,
          image: userInfo.picture,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      dbUser = newUsers

      // Also create the account record (linking to Google OAuth provider)
      await db.insert(account).values({
        id: `google_${userInfo.id}_account`,
        accountId: userInfo.id,
        providerId: 'google',
        userId: dbUser[0].id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        accessTokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      console.log('[Exchange Code] Created new user:', dbUser[0].id)
    } else {
      console.log('[Exchange Code] Found existing user:', dbUser[0].id)

      // Update the account tokens
      await db
        .update(account)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          idToken: tokens.id_token,
          accessTokenExpiresAt: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(account.userId, dbUser[0].id))
    }

    // Return the session data to the Expo app with the database user ID
    return NextResponse.json({
      user: {
        id: dbUser[0].id, // Use database user ID, not Google ID
        email: dbUser[0].email,
        name: dbUser[0].name,
        image: dbUser[0].image,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    }, {
      headers: corsHeaders,
    })

  } catch (error) {
    console.error('[Exchange Code] Error:', error)
    console.error('[Exchange Code] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
}
