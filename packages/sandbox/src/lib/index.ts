// Sandbox library exports

// File watcher
export {
  SandboxFileWatcher,
  globalFileWatcher,
  type FileChangeEvent,
} from './sandbox-file-watcher'

// GitHub service
export { GitHubService, type GitHubConfig } from './github-service'

// Error tracking (re-exported from @flutter-vibe-code/error-manager for backwards compatibility)
export {
  ErrorTracker,
  extractErrorDetails,
} from '@flutter-vibe-code/error-manager/server'
export type { SandboxErrorContext } from '@flutter-vibe-code/error-manager/shared'

// Bundle builder
export {
  buildStaticBundle,
  getLatestCommitSHA,
} from './bundle-builder'

// Manifest generation
export {
  generateManifest,
  validateManifest,
} from './generate-manifest'

// Server utilities
export { startExpoServer, startFlutterServer, type TunnelMode } from './server-utils'
