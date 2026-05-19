import type {
  SandboxErrorContext,
  ErrorStats,
  ExtractedErrorDetails,
} from '../shared/types'

/**
 * Error Tracking Utility
 *
 * Provides comprehensive error tracking and logging for debugging
 * sandbox execution issues and stream terminations.
 */
export class ErrorTracker {
  private static errors: SandboxErrorContext[] = []
  private static MAX_ERRORS = 100 // Keep last 100 errors in memory

  /**
   * Track a sandbox-related error
   */
  static trackError(context: SandboxErrorContext): void {
    this.errors.push(context)

    // Keep only the most recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS)
    }

    // Log to console with clear formatting
    console.error('==================== ERROR TRACKED ====================')
    console.error(JSON.stringify(context, null, 2))
    console.error('=======================================================')
  }

  /**
   * Track a sandbox termination error with enhanced context
   */
  static trackSandboxTermination(
    error: unknown,
    context: Partial<SandboxErrorContext>
  ): void {
    const errorContext: SandboxErrorContext = {
      operation: 'sandbox_execution',
      timestamp: new Date().toISOString(),
      errorType:
        error instanceof Error
          ? error.constructor.name
          : typeof error === 'object' && error !== null && 'constructor' in error
            ? (error.constructor as { name?: string }).name
            : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorCode:
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string | number }).code
          : undefined,
      errorDetails:
        typeof error === 'object' && error !== null
          ? ('details' in error
              ? (error as { details?: unknown }).details
              : 'response' in error
                ? (error as { response?: unknown }).response
                : undefined)
          : undefined,
      ...context,
    }

    // Add specific termination analysis
    if (errorContext.errorMessage?.includes('terminated')) {
      errorContext.additionalContext = {
        ...errorContext.additionalContext,
        likelyCauses: [
          'Sandbox was killed/paused externally',
          'Connection to E2B was lost',
          'Sandbox ran out of resources (memory/CPU)',
          'Timeout exceeded',
          'Network interruption',
        ],
        recommendations: [
          'Check sandbox status with E2B dashboard',
          'Verify network connectivity',
          'Review timeout settings',
          'Check resource limits',
          'Review sandbox logs',
        ],
      }
    }

    this.trackError(errorContext)
  }

  /**
   * Get recent errors for a specific project
   */
  static getProjectErrors(projectId: string): SandboxErrorContext[] {
    return this.errors.filter((e) => e.projectId === projectId)
  }

  /**
   * Get recent errors for a specific sandbox
   */
  static getSandboxErrors(sandboxId: string): SandboxErrorContext[] {
    return this.errors.filter((e) => e.sandboxId === sandboxId)
  }

  /**
   * Get all recent errors
   */
  static getAllErrors(): SandboxErrorContext[] {
    return [...this.errors]
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): ErrorStats {
    const errorsByType: Record<string, number> = {}
    const errorsByOperation: Record<string, number> = {}

    for (const error of this.errors) {
      const type = error.errorType || 'Unknown'
      const operation = error.operation || 'Unknown'

      errorsByType[type] = (errorsByType[type] || 0) + 1
      errorsByOperation[operation] = (errorsByOperation[operation] || 0) + 1
    }

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsByOperation,
      recentErrors: this.errors.slice(-10),
    }
  }

  /**
   * Clear all tracked errors
   */
  static clearErrors(): void {
    this.errors = []
  }

  /**
   * Clear errors for a specific project
   */
  static clearProjectErrors(projectId: string): void {
    this.errors = this.errors.filter((e) => e.projectId !== projectId)
  }

  /**
   * Clear errors for a specific sandbox
   */
  static clearSandboxErrors(sandboxId: string): void {
    this.errors = this.errors.filter((e) => e.sandboxId !== sandboxId)
  }
}

/**
 * Helper function to extract error details from any error object
 */
export function extractErrorDetails(error: unknown): ExtractedErrorDetails {
  if (error instanceof Error) {
    return {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
      code:
        'code' in error ? (error as { code?: string | number }).code : undefined,
      details:
        'details' in error
          ? (error as { details?: unknown }).details
          : 'response' in error
            ? (error as { response?: unknown }).response
            : 'data' in error
              ? (error as { data?: unknown }).data
              : undefined,
    }
  }

  if (typeof error === 'object' && error !== null) {
    return {
      type:
        'constructor' in error
          ? (error.constructor as { name?: string }).name || 'UnknownError'
          : 'UnknownError',
      message: 'message' in error ? String(error.message) : String(error),
      code: 'code' in error ? (error as { code?: string | number }).code : undefined,
      details:
        'details' in error
          ? (error as { details?: unknown }).details
          : 'response' in error
            ? (error as { response?: unknown }).response
            : 'data' in error
              ? (error as { data?: unknown }).data
              : undefined,
    }
  }

  return {
    type: 'UnknownError',
    message: String(error),
  }
}
