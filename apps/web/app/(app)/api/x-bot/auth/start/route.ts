// app/api/auth/start/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export async function GET() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'TWITTER_CLIENT_ID not set' }, { status: 500 });
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  // Store verifier in cookie (secure for local dev; use httpOnly, secure in prod)
  (await cookies()).set('code_verifier', codeVerifier, { httpOnly: true, path: '/', maxAge: 60 * 10 }); // 10 min

  // Get the current host dynamically
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3210';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/x-bot/auth/callback`;

  const scopes = 'tweet.read tweet.write users.read offline.access';
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=state&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return NextResponse.json({ authUrl });
}