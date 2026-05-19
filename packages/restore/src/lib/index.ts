export {
  getGitStatus,
  isGitRepository,
  getCurrentBranch,
  getCurrentCommitHash,
  getShortCommitHash,
  clearCache,
  killServerProcesses,
  touchSourceFiles,
} from './git-operations'

// Re-export GitHubService from sandbox package for convenience
export { GitHubService } from '@flutter-vibe-code/sandbox'
