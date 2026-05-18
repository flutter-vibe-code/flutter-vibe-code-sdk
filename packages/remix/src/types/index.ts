/**
 * Public project information returned from the public API
 */
export interface PublicProject {
  id: string
  title: string
  userId: string
  template: string
  status: string
  sandboxUrl: string | null
  e2bUrl: string | null
  deployedUrl: string | null
  forkCount: string
  screenshotMobile: string | null
  screenshotDesktop: string | null
  createdAt: Date
  userName: string | null
  userImage: string | null
  isPublic: boolean
}

/**
 * Request body for the remix API
 */
export interface RemixRequest {
  userID: string
}

/**
 * Response from the remix API
 */
export interface RemixResponse {
  success: boolean
  projectId: string
  sandboxId: string
  message: string
  codeCloned: boolean
  sandboxUrl?: string
  e2bUrl?: string
  warning?: string
  warnings?: string[]
}

/**
 * Error response from APIs
 */
export interface ApiError {
  error: string
  details?: string
}

/**
 * Parameters for remix handler
 */
export interface RemixHandlerParams {
  sourceProjectId: string
  userId: string
}

/**
 * Parameters for public project handler
 */
export interface PublicProjectParams {
  projectId: string
}

/**
 * Convex error patterns for detection
 */
export const CONVEX_ERROR_PATTERNS = [
  /error:/i,
  /Error:/,
  /failed to/i,
  /Unable to/i,
  /Cannot find/i,
  /is not defined/i,
  /Argument .* is not/i,
  /Expected .* but got/i,
  /ValidationError/i,
  /SchemaValidationError/i,
  /ConvexError/i,
  /Uncaught exception/i,
  /TypeError:/i,
  /ReferenceError:/i,
  /SyntaxError:/i,
  /Invalid argument/i,
  /Missing required/i,
  /✖/, // Convex CLI error indicator
]

/**
 * Convex setup parameters
 */
export interface ConvexSetupParams {
  projectId: string
  userId: string
  sandbox: any // Sandbox type from @e2b/code-interpreter
  appName: string
  sourceProjectId: string
}

/**
 * Convex dev server parameters
 */
export interface ConvexDevServerParams {
  projectId: string
  sandbox: any // Sandbox type from @e2b/code-interpreter
  adminKey: string
  deploymentUrl: string
}
