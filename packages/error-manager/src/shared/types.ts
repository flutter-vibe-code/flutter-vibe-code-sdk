/**
 * Error notification payload sent via Pusher
 */
export interface ErrorNotification {
  message: string
  timestamp: string
  projectId: string
  type?: 'runtime-error' | 'convex-error' | 'build-error' | 'custom'
  source?: 'expo-server' | 'convex-dev' | 'metro-bundler' | 'custom'
}

/**
 * Error tracking context for debugging and analytics
 */
export interface SandboxErrorContext {
  sandboxId?: string
  projectId?: string
  userId?: string
  messageId?: string
  operation: string
  timestamp: string
  errorType?: string
  errorMessage?: string
  errorStack?: string
  errorCode?: string | number
  errorDetails?: unknown
  additionalContext?: Record<string, unknown>
}

/**
 * Extracted error details from any error object
 */
export interface ExtractedErrorDetails {
  type: string
  message: string
  stack?: string
  code?: string | number
  details?: unknown
}

/**
 * Error statistics for monitoring
 */
export interface ErrorStats {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByOperation: Record<string, number>
  recentErrors: SandboxErrorContext[]
}

/**
 * Configuration for error notification sources
 */
export interface ErrorSourceConfig {
  type: ErrorNotification['type']
  source: ErrorNotification['source']
  patterns: RegExp[]
  excludePatterns?: RegExp[]
}

/**
 * Error buffer for accumulating multi-line errors
 */
export interface ErrorBuffer {
  buffer: string
  timeout: NodeJS.Timeout | null
}
