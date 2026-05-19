/**
 * Legacy Bundle Redirect Endpoint (Catch-all)
 * Maintains backward compatibility with old mobile app bundle URLs
 * Redirects: /api/project/{projectId}/{commitId}/{...path} -> Vercel Blob URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { commits } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/project/[projectId]/[commitId]/[...path]
 * Redirect to Vercel Blob bundle URL
 *
 * Examples:
 * - /api/project/abc/def/ios/manifest.json -> blob URL
 * - /api/project/abc/def/assets/image.png -> blob URL
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ projectId: string; commitId: string; path: string[] }> }
) {
  const params = await props.params;
  try {
    const { projectId, commitId, path } = params

    // Reconstruct file path from array
    const filePath = path.join('/')

    console.log('[Legacy Redirect] Request:', {
      projectId,
      commitId,
      filePath,
    })

    // Find the commit in database
    const [commit] = await db
      .select()
      .from(commits)
      .where(
        and(
          eq(commits.projectId, projectId),
          eq(commits.githubSHA, commitId)
        )
      )
      .limit(1)

    if (!commit || !commit.bundleUrl) {
      console.error('[Legacy Redirect] Bundle not found:', { projectId, commitId })
      return NextResponse.json(
        { error: 'Bundle not found for this commit' },
        { status: 404 }
      )
    }

    // Extract base URL from commit's bundle URL
    // commit.bundleUrl is the manifest URL like: "https://blob.../bundles/proj/sha/ios/manifest.json"
    // We need base path: "https://blob.../bundles/proj/sha/"
    let blobBaseUrl = commit.bundleUrl
    if (blobBaseUrl.includes('/ios/manifest.json')) {
      blobBaseUrl = blobBaseUrl.replace('/ios/manifest.json', '/')
    } else if (!blobBaseUrl.endsWith('/')) {
      // If bundleUrl doesn't have the manifest part, assume it's the base URL
      blobBaseUrl += '/'
    }

    // Construct full blob URL for requested file
    const blobUrl = blobBaseUrl + filePath

    console.log('[Legacy Redirect] Redirecting:', {
      from: `/api/project/${projectId}/${commitId}/${filePath}`,
      to: blobUrl,
    })

    // Redirect to Vercel Blob (307 = temporary redirect, preserves method)
    return NextResponse.redirect(blobUrl, 307)
  } catch (error) {
    console.error('[Legacy Redirect] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
