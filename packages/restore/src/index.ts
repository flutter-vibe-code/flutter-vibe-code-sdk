// @flutter-vibe-code/restore - Git version control and code restoration
//
// Server-only exports from main entry point.
// For client components, import from '@flutter-vibe-code/restore/components'
// For hooks, import from '@flutter-vibe-code/restore/hooks'

// Types
export * from './types'

// API handlers (server-only)
export {
  getGitCommits,
  gitCommitsMaxDuration,
  restoreGitCommit,
  gitRestoreMaxDuration,
  commitToGitHub,
  githubCommitMaxDuration,
} from './api'

// Lib utilities (server-only)
export {
  getGitStatus,
  isGitRepository,
  getCurrentBranch,
  getCurrentCommitHash,
  getShortCommitHash,
  clearCache,
  killServerProcesses,
  touchSourceFiles,
  GitHubService,
} from './lib'
