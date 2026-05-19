/**
 * Bundle Cleanup Service
 * Manages cleanup of old static bundles from Vercel Blob to save storage costs
 */

import { list, del } from '@vercel/blob'
import { db } from './db'
import { projects, commits } from './db/schema'
import { eq, lt, desc } from 'drizzle-orm'

interface CleanupResult {
  deletedCount: number
  freedSpace: number
  errors: string[]
}

/**
 * Clean up old bundles for a specific project
 * Keeps the latest N commits and deletes older ones
 */
export async function cleanupProjectBundles(
  projectId: string,
  keepCount: number = 5
): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedCount: 0,
    freedSpace: 0,
    errors: [],
  }

  try {

    // Get all commits for this project, ordered by newest first
    const projectCommits = await db
      .select()
      .from(commits)
      .where(eq(commits.projectId, projectId))
      .orderBy(desc(commits.createdAt))


    // Keep the latest N commits
    const commitsToKeep = projectCommits.slice(0, keepCount)
    const commitsToDelete = projectCommits.slice(keepCount)

      `[BundleCleanup] Keeping ${commitsToKeep.length} commits, deleting ${commitsToDelete.length}`
    )

    // Delete bundles from Vercel Blob for old commits
    for (const commit of commitsToDelete) {
      try {
        // List all blobs for this commit
        const { blobs } = await list({
          prefix: `bundles/${projectId}/${commit.githubSHA}/`,
        })

          `[BundleCleanup] Found ${blobs.length} blobs for commit ${commit.githubSHA}`
        )

        // Delete each blob
        for (const blob of blobs) {
          try {
            await del(blob.url)
            result.deletedCount++
            result.freedSpace += blob.size
          } catch (error) {
            console.error('[BundleCleanup] Error deleting blob:', error)
            result.errors.push(
              `Failed to delete blob ${blob.pathname}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        }

        // Delete commit record from database
        await db.delete(commits).where(eq(commits.id, commit.id))

          `[BundleCleanup] Deleted commit record: ${commit.githubSHA}`
        )
      } catch (error) {
        console.error(
          `[BundleCleanup] Error cleaning up commit ${commit.githubSHA}:`,
          error
        )
        result.errors.push(
          `Failed to clean commit ${commit.githubSHA}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

      `[BundleCleanup] Cleanup complete. Deleted ${result.deletedCount} blobs, freed ${(result.freedSpace / 1024 / 1024).toFixed(2)} MB`
    )
  } catch (error) {
    console.error('[BundleCleanup] Error during cleanup:', error)
    result.errors.push(
      `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

/**
 * Clean up bundles for all projects
 * Run this periodically via cron job or Inngest
 */
export async function cleanupAllProjects(
  keepCount: number = 5
): Promise<CleanupResult> {
  const totalResult: CleanupResult = {
    deletedCount: 0,
    freedSpace: 0,
    errors: [],
  }

  try {

    // Get all projects that have bundles
    const projectsWithBundles = await db
      .select()
      .from(projects)
      .where(eq(projects.staticBundleUrl, null)) // Only projects with bundles

      `[BundleCleanup] Found ${projectsWithBundles.length} projects with bundles`
    )

    // Clean up each project
    for (const project of projectsWithBundles) {
      try {
        const result = await cleanupProjectBundles(project.id, keepCount)
        totalResult.deletedCount += result.deletedCount
        totalResult.freedSpace += result.freedSpace
        totalResult.errors.push(...result.errors)
      } catch (error) {
        console.error(
          `[BundleCleanup] Error cleaning project ${project.id}:`,
          error
        )
        totalResult.errors.push(
          `Failed to clean project ${project.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

      `[BundleCleanup] Total cleanup complete. Deleted ${totalResult.deletedCount} blobs, freed ${(totalResult.freedSpace / 1024 / 1024).toFixed(2)} MB`
    )
  } catch (error) {
    console.error('[BundleCleanup] Error during global cleanup:', error)
    totalResult.errors.push(
      `Global cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return totalResult
}

/**
 * Clean up bundles older than a specific date
 */
export async function cleanupBundlesOlderThan(
  daysOld: number = 30
): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedCount: 0,
    freedSpace: 0,
    errors: [],
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      `[BundleCleanup] Cleaning up bundles older than ${cutoffDate.toISOString()}`
    )

    // Get old commits
    const oldCommits = await db
      .select()
      .from(commits)
      .where(lt(commits.createdAt, cutoffDate))


    // Delete bundles for old commits
    for (const commit of oldCommits) {
      try {
        // List all blobs for this commit
        const { blobs } = await list({
          prefix: `bundles/${commit.projectId}/${commit.githubSHA}/`,
        })

        // Delete each blob
        for (const blob of blobs) {
          try {
            await del(blob.url)
            result.deletedCount++
            result.freedSpace += blob.size
          } catch (error) {
            console.error('[BundleCleanup] Error deleting blob:', error)
            result.errors.push(
              `Failed to delete blob: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        }

        // Delete commit record
        await db.delete(commits).where(eq(commits.id, commit.id))
      } catch (error) {
        console.error('[BundleCleanup] Error cleaning old commit:', error)
        result.errors.push(
          `Failed to clean old commit: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

      `[BundleCleanup] Cleanup complete. Deleted ${result.deletedCount} blobs, freed ${(result.freedSpace / 1024 / 1024).toFixed(2)} MB`
    )
  } catch (error) {
    console.error('[BundleCleanup] Error during date-based cleanup:', error)
    result.errors.push(
      `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}
