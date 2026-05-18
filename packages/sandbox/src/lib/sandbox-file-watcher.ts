import { Sandbox } from '@e2b/code-interpreter'

export interface FileChangeEvent {
  type: 'file_change'
  projectId: string
  files: Array<{
    path: string
    action: 'created' | 'modified' | 'deleted'
    timestamp: string
  }>
}

export class SandboxFileWatcher {
  private watchers = new Map<string, { sandbox: Sandbox; watchHandle: any }>()

  /**
   * Start watching file changes in a sandbox using E2B's native file watching
   * @param projectId - The project ID for the sandbox
   * @param sandbox - The E2B sandbox instance
   * @param onFileChange - Callback function when files change
   */
  async startWatching(
    projectId: string,
    sandbox: Sandbox,
    onFileChange: (event: FileChangeEvent) => void
  ): Promise<void> {
    // Stop existing watcher if any
    await this.stopWatching(projectId)

    try {
      // Check if the sandbox has the files.watchDir method
      if (typeof sandbox.files?.watchDir === 'function') {
        // Use E2B's native file watching API
        // Set timeoutMs: 0 to disable timeout for long-running watch operations
        const watchHandle = await sandbox.files.watchDir('/home/user/app', async (event: any) => {
          try {
            // Extract the file path relative to the app directory
            let filePath = event.name || event.path || event.filename || ''
            if (filePath.startsWith('/home/user/app/')) {
              filePath = filePath.replace('/home/user/app/', '')
            } else if (filePath.startsWith('/home/user/app')) {
              filePath = filePath.replace('/home/user/app', '')
            } else if (filePath.startsWith('./')) {
              filePath = filePath.replace('./', '')
            }

            // Skip if no valid file path
            if (!filePath) {
              return
            }

            // Filter out temporary files and directories
            if (filePath.includes('.git/') ||
                filePath.includes('node_modules/') ||
                filePath.includes('.expo/') ||
                filePath.includes('.next/') ||
                filePath.includes('dist/') ||
                filePath.includes('build/') ||
                filePath.endsWith('.tmp') ||
                filePath.endsWith('.swp') ||
                filePath.includes('~') ||
                filePath.startsWith('.')) {
              return
            }

            // Map E2B event types to our action types
            let action: 'created' | 'modified' | 'deleted'
            const eventType = (event.type || event.eventType || event.operation || 'modified').toString().toLowerCase()

            if (eventType.includes('create') || eventType.includes('add') || eventType.includes('write')) {
              action = 'created'
            } else if (eventType.includes('delete') || eventType.includes('remove')) {
              action = 'deleted'
            } else {
              action = 'modified'
            }

            const changes = [{
              path: filePath,
              action,
              timestamp: new Date().toISOString()
            }]

            onFileChange({
              type: 'file_change',
              projectId,
              files: changes
            })

          } catch (error) {
            console.error('❌ [FileWatcher] Error processing E2B file change event:', error)
          }
        }, { recursive: true, timeoutMs: 0 })

        this.watchers.set(projectId, { sandbox, watchHandle })
      } else {
        // Initialize the last_check file
        await sandbox.commands.run('touch /tmp/last_check')

        // OPTIMIZED: Fallback polling with exponential backoff
        let pollCount = 0
        let pollInterval: NodeJS.Timeout

        const pollForChanges = async () => {
          try {
            const result = await sandbox.commands.run('find /home/user/app -type f -newer /tmp/last_check 2>/dev/null | head -10 && touch /tmp/last_check', { timeoutMs: 30000 })
            if (result.stdout && result.stdout.trim()) {
              const changedFiles = result.stdout.trim().split('\n')
              const changes = changedFiles.map(fullPath => {
                let filePath = fullPath.replace('/home/user/app/', '')
                return {
                  path: filePath,
                  action: 'modified' as const,
                  timestamp: new Date().toISOString()
                }
              }).filter(change =>
                change.path &&
                !change.path.includes('.git/') &&
                !change.path.includes('node_modules/') &&
                !change.path.includes('.expo/') &&
                !change.path.includes('.next/')
              )

              if (changes.length > 0) {
                onFileChange({
                  type: 'file_change',
                  projectId,
                  files: changes
                })
              }
            }
            pollCount++
          } catch (error) {
            console.error('❌ [FileWatcher] Polling error:', error)
          }
        }

        // Smart polling: 5s for first 6 checks, then 15s, then 30s
        const getNextInterval = () => {
          if (pollCount < 6) return 5000    // First 30 seconds: poll every 5s
          if (pollCount < 12) return 15000   // Next minute: poll every 15s
          return 30000                       // After that: poll every 30s
        }

        const scheduleNextPoll = () => {
          pollInterval = setTimeout(async () => {
            await pollForChanges()
            scheduleNextPoll()
          }, getNextInterval())
        }

        scheduleNextPoll()

        const watchHandle = {
          stop: () => clearInterval(pollInterval),
          type: 'polling'
        }

        this.watchers.set(projectId, { sandbox, watchHandle })
      }

    } catch (error) {
      console.error(`❌ [FileWatcher] Failed to start E2B file watcher for project ${projectId}:`, error)
      this.watchers.delete(projectId)
    }
  }

  /**
   * Stop watching file changes for a project
   */
  async stopWatching(projectId: string): Promise<void> {
    const watcher = this.watchers.get(projectId)
    if (watcher) {
      try {
        // Stop the file watcher handle (E2B native or polling)
        if (watcher.watchHandle && typeof watcher.watchHandle.stop === 'function') {
          if (watcher.watchHandle.type === 'polling') {
            watcher.watchHandle.stop()
          } else {
            await watcher.watchHandle.stop()
          }
        }
      } catch (error) {
        console.error(`❌ [FileWatcher] Error stopping file watcher for project ${projectId}:`, error)
      } finally {
        this.watchers.delete(projectId)
      }
    }
  }

  /**
   * Stop all watchers
   */
  async stopAllWatchers(): Promise<void> {
    const projectIds = Array.from(this.watchers.keys())
    await Promise.all(projectIds.map(id => this.stopWatching(id)))
  }

  /**
   * Check if a project is being watched
   */
  isWatching(projectId: string): boolean {
    return this.watchers.has(projectId)
  }

  /**
   * Get the list of watched projects
   */
  getWatchedProjects(): string[] {
    return Array.from(this.watchers.keys())
  }
}

// Global instance
export const globalFileWatcher = new SandboxFileWatcher()
