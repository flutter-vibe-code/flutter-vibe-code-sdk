// OAuth callback route
// Receives the authorization code and exchanges it for a token

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects, convexProjectCredentials } from '@flutter-vibe-code/database'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  // Use explicit base URL if set, otherwise fall back to detected origin
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || requestOrigin
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state') // This is the projectId

  // Handle OAuth error
  if (error) {
    return NextResponse.redirect(
      `${origin}/p/${state || 'new'}?convex_error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/p/${state || 'new'}?convex_error=no_code`)
  }

  if (!state) {
    return NextResponse.redirect(`${origin}?convex_error=missing_project_id`)
  }

  const projectId = state

  // Exchange the code for a token by calling our API endpoint
  try {
    const callbackUrl = new URL(`${origin}/api/convex/callback`)
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('redirect_uri', `${origin}/convex/callback`)

    const response = await fetch(callbackUrl.toString())
    const data = await response.json()

    if (!response.ok || data.error) {
      const errorMsg = data.error || 'Failed to exchange OAuth code'
      return NextResponse.redirect(
        `${origin}/p/${projectId}?convex_error=${encodeURIComponent(errorMsg)}`
      )
    }

    // Parse deployment name to get team and project slugs
    // Format is typically: team-slug/project-slug or just deployment-name
    const deploymentName = data.deploymentName
    const deploymentUrl = data.deploymentUrl
    const token = data.token

    // Extract team and project slugs from deployment name
    let teamSlug = 'default'
    let projectSlug = deploymentName
    if (deploymentName.includes('/')) {
      const parts = deploymentName.split('/')
      teamSlug = parts[0]
      projectSlug = parts[1]
    }

    // Get the project to find the userId
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)

    if (!project) {
      return NextResponse.redirect(
        `${origin}/p/${projectId}?convex_error=project_not_found`
      )
    }

    // Save credentials to database
    await db.insert(convexProjectCredentials).values({
      projectId,
      userId: project.userId,
      teamSlug,
      projectSlug,
      deploymentUrl,
      deploymentName,
      adminKey: token,
      accessToken: token,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: convexProjectCredentials.projectId,
      set: {
        teamSlug,
        projectSlug,
        deploymentUrl,
        deploymentName,
        adminKey: token,
        accessToken: token,
        updatedAt: new Date(),
      },
    })

    // Update project state to "connected"
    await db
      .update(projects)
      .set({
        convexProject: {
          kind: 'connected',
          projectSlug,
          teamSlug,
          deploymentUrl,
          deploymentName,
        },
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    console.log('[Convex OAuth] Successfully connected project', projectId, 'to Convex deployment', deploymentName)

    // Redirect back to project page with success
    const successUrl = new URL(`${origin}/p/${projectId}`)
    successUrl.searchParams.set('convex_success', '1')

    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.error('Error in Convex OAuth callback:', error)
    return NextResponse.redirect(
      `${origin}/p/${projectId}?convex_error=exchange_failed`
    )
  }
}
