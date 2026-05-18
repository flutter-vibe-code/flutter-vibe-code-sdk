// API endpoint for OAuth token exchange
// Exchanges authorization code for access token and provisions deployment

import { NextResponse } from 'next/server'
import { exchangeOAuthCode, provisionDeployment } from '@/lib/convex/provisioning'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectUri = searchParams.get('redirect_uri')

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 })
  }

  if (!redirectUri) {
    return NextResponse.json({ error: 'No redirect URI provided' }, { status: 400 })
  }

  const clientId = process.env.CONVEX_OAUTH_CLIENT_ID
  const clientSecret = process.env.CONVEX_OAUTH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'CONVEX_OAUTH_CLIENT_ID or CONVEX_OAUTH_CLIENT_SECRET not configured' },
      { status: 500 }
    )
  }

  try {
    // Step 1: Exchange the authorization code for an access token
    const tokenData = await exchangeOAuthCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    })

    const token = tokenData.access_token

    // Step 2: Use the token to provision a deployment
    const deployment = await provisionDeployment({
      projectDeployKey: token,
      deploymentType: 'dev',
    })

    // Return the token and deployment info
    return NextResponse.json({
      token,
      deploymentName: deployment.deploymentName,
      deploymentUrl: deployment.url,
    })
  } catch (error) {
    console.error('Error in Convex OAuth callback API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
