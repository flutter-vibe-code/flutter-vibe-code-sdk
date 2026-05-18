/**
 * Error detection patterns for different sources
 */

/**
 * React/Expo/React Native runtime error patterns
 */
export const EXPO_ERROR_PATTERNS: RegExp[] = [
  // React errors
  /Uncaught Error/i,
  /Element type is invalid/i,
  /Cannot read propert(?:y|ies) of undefined/i,
  /Cannot read propert(?:y|ies) of null/i,
  /is not a function/i,
  /is not defined/i,
  /Invariant Violation/i,
  /Warning: Failed prop type/i,

  // React Native specific errors
  /Invariant Violation: requireNativeComponent/i,
  /Unable to resolve module/i,
  /Module not found/i,
  /SyntaxError:/i,
  /TypeError:/i,
  /ReferenceError:/i,
  /RangeError:/i,

  // Import/export errors
  /export .* was not found in/i,
  /forgot to export your component/i,
  /mixed up default and named imports/i,

  // React component errors
  /Check the render method of/i,
  /The above error occurred in the/i,

  // Metro bundler errors (critical ones)
  /error: bundling failed/i,
  /error: Unable to resolve module/i,
  /BUNDLE.*failed/i,

  // JSX/transform errors
  /Expected corresponding JSX closing tag/i,
  /Unterminated JSX contents/i,
  /JSX element .* has no corresponding closing tag/i,
  /Unexpected token/i,
]

/**
 * Convex-specific error patterns
 */
export const CONVEX_ERROR_PATTERNS: RegExp[] = [
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
  /\u2716/, // Convex CLI error indicator (checkmark symbol)
]

/**
 * Convex success patterns to skip
 */
export const CONVEX_SUCCESS_PATTERNS: RegExp[] = [
  /Convex functions ready/,
  /\u2714/, // Checkmark symbol
  /Watching for changes/,
  /bunx convex dev/,
]

/**
 * Sensitive patterns that should not be sent to clients
 * NOTE: These must be specific enough to avoid filtering legitimate error messages.
 * E.g., /TOKEN/i would match "Unexpected token" in JS syntax errors.
 */
export const SENSITIVE_PATTERNS: RegExp[] = [
  /ANTHROPIC_API_KEY/,
  /API_KEY\s*[=:]/,
  /SECRET\s*[=:]/,
  /PASSWORD\s*[=:]/,
  /ACCESS_TOKEN\s*[=:]/,
  /PRIVATE_KEY/,
  /sk-[a-zA-Z0-9]{20,}/,
]
