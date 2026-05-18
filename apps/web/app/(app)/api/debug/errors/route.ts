import { ErrorTracker } from '@/lib/error-tracker'
import { NextRequest } from 'next/server'

/**
 * Debug endpoint to view tracked errors
 *
 * Usage:
 * - GET /api/debug/errors - Get all errors and statistics
 * - GET /api/debug/errors?projectId=xxx - Get errors for a specific project
 * - GET /api/debug/errors?sandboxId=xxx - Get errors for a specific sandbox
 * - GET /api/debug/errors?stats=true - Get only statistics
 */
export async function GET(req: NextRequest) {
  // Only allow in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_ERROR_DEBUG !== 'true') {
    return Response.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const sandboxId = searchParams.get('sandboxId')
  const statsOnly = searchParams.get('stats') === 'true'

  if (statsOnly) {
    const stats = ErrorTracker.getErrorStats()
    return Response.json({ stats })
  }

  if (projectId) {
    const errors = ErrorTracker.getProjectErrors(projectId)
    return Response.json({
      projectId,
      errorCount: errors.length,
      errors,
    })
  }

  if (sandboxId) {
    const errors = ErrorTracker.getSandboxErrors(sandboxId)
    return Response.json({
      sandboxId,
      errorCount: errors.length,
      errors,
    })
  }

  const allErrors = ErrorTracker.getAllErrors()
  const stats = ErrorTracker.getErrorStats()

  return Response.json({
    totalErrors: allErrors.length,
    stats,
    errors: allErrors,
  })
}

/**
 * Clear tracked errors
 * DELETE /api/debug/errors - Clear all errors
 * DELETE /api/debug/errors?projectId=xxx - Clear errors for a specific project
 */
export async function DELETE(req: NextRequest) {
  // Only allow in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_ERROR_DEBUG !== 'true') {
    return Response.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (projectId) {
    ErrorTracker.clearProjectErrors(projectId)
    return Response.json({ message: `Cleared errors for project ${projectId}` })
  }

  ErrorTracker.clearErrors()
  return Response.json({ message: 'All errors cleared' })
}
