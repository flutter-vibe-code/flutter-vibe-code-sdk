import { fileCache, type SearchResult } from './file-cache'

interface BulkFilesResponse {
  files: Array<{
    path: string
    content: string
    size: number
    lastModified: number
  }>
}

export interface SearchOptions {
  isRegex?: boolean
  isCaseSensitive?: boolean
  contextLines?: number
  maxResults?: number
}

class SearchService {
  private projectId: string | null = null
  private isInitialized: boolean = false
  private isCaching: boolean = false
  private refreshedProjects: Set<string> = new Set()

  async initialize(projectId: string): Promise<void> {
    if (this.projectId === projectId && this.isInitialized) {
      return
    }

    this.projectId = projectId
    await fileCache.init()
    this.isInitialized = true

    // Debug: Show what's currently in cache
    await fileCache.debugCacheContents()
  }

  async cacheProjectFiles(projectId: string, forceRefresh: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize(projectId)
    }

    if (this.isCaching) {
      return
    }

    this.isCaching = true

    try {
      // Force refresh on first load of each project this session
      if (!this.refreshedProjects.has(projectId) && !forceRefresh) {
        forceRefresh = true
        this.refreshedProjects.add(projectId)
      }

      // Clear existing cache for this project before fetching new data
      if (forceRefresh) {
        await this.clearProjectCache(projectId)
      }

      // If not forcing refresh and we have cached files for this project, use them
      if (!forceRefresh) {
        const existingFiles = await fileCache.getAllProjectFiles(projectId)
        if (existingFiles.length > 0) {
          this.isCaching = false
          return
        }
      }

      // Fetch all files from the API
      const response = await fetch('/api/sandbox-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          action: 'bulk-files',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch bulk files: ${response.status}`)
      }

      const data: BulkFilesResponse = await response.json()

      if (!data.files || data.files.length === 0) {
        this.isCaching = false
        return
      }

      // Cache all files with normalized paths
      const filesToCache = data.files.map((file) => ({
        projectId,
        filePath: file.path.startsWith('./') ? file.path.slice(2) : file.path,
        content: file.content,
        lastModified: file.lastModified,
        size: file.size,
      }))

      await fileCache.cacheMultipleFiles(filesToCache)

      // Debug: Show all cache contents after caching
      await fileCache.debugCacheContents()
    } catch (error) {
      console.error('[SearchService] Error caching files:', error)
      throw error
    } finally {
      this.isCaching = false
    }
  }

  async searchInProject(
    projectId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize(projectId)
    }

    if (!query.trim()) {
      return []
    }

    const { isRegex = false, contextLines = 2, maxResults = 500 } = options

    try {
      // Ensure files are cached (will force refresh on first load)
      await this.cacheProjectFiles(projectId)

      // Perform search using file cache
      let results = await fileCache.searchInProject(projectId, query, isRegex, contextLines)

      // Sort results by relevance (file name first, then line number)
      results.sort((a, b) => {
        if (a.filePath !== b.filePath) {
          return a.filePath.localeCompare(b.filePath)
        }
        return a.lineNumber - b.lineNumber
      })

      // Limit results
      if (results.length > maxResults) {
        results = results.slice(0, maxResults)
      }

      return results
    } catch (error) {
      console.error('[SearchService] Search error:', error)
      return []
    }
  }

  async getFileContent(projectId: string, filePath: string): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize(projectId)
    }

    try {
      const cachedFile = await fileCache.getFile(projectId, filePath)
      return cachedFile?.content || null
    } catch (error) {
      console.error('[SearchService] Error getting file content:', error)
      return null
    }
  }

  async clearProjectCache(projectId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize(projectId)
    }

    try {
      await fileCache.clearProject(projectId)
    } catch (error) {
      console.error('[SearchService] Error clearing cache:', error)
      // Don't throw - continue even if clearing fails
    }
  }

  async getCacheInfo(): Promise<{ totalFiles: number; totalSize: number }> {
    if (!this.isInitialized) {
      return { totalFiles: 0, totalSize: 0 }
    }

    try {
      return await fileCache.getStorageInfo()
    } catch (error) {
      console.error('[SearchService] Error getting cache info:', error)
      return { totalFiles: 0, totalSize: 0 }
    }
  }

  isCachingFiles(): boolean {
    return this.isCaching
  }

  // Preload files for a project (useful for when a project is first loaded)
  async preloadProjectFiles(projectId: string): Promise<void> {
    // Run in background without blocking
    setTimeout(async () => {
      try {
        // This will automatically force refresh on first session load
        await this.cacheProjectFiles(projectId)
      } catch {
        // Silently ignore preload errors
      }
    }, 1000) // Wait 1 second to not interfere with initial page load
  }

  // Update individual files in IndexedDB when they change
  async updateChangedFiles(
    projectId: string,
    changedFiles: Array<{ path: string; content?: string }>
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize(projectId)
    }

    // If there are many changes, it might be more efficient to refresh the entire cache
    if (changedFiles.length > 10) {
      await this.cacheProjectFiles(projectId, true) // Force refresh
      return
    }

    try {
      // Process files in parallel for better performance
      const updatePromises = changedFiles.map(async (fileChange) => {
        // Normalize the file path (remove leading ./ if present)
        const normalizedPath = fileChange.path.startsWith('./')
          ? fileChange.path.slice(2)
          : fileChange.path

        if (fileChange.content !== undefined) {
          // File was modified - update its content
          await fileCache.cacheFile({
            projectId,
            filePath: normalizedPath,
            content: fileChange.content,
            lastModified: Date.now(),
            size: fileChange.content.length,
          })
        } else {
          // File was created/modified but we need to fetch its content
          await this.fetchAndCacheFile(projectId, normalizedPath)
        }
      })

      await Promise.all(updatePromises)
    } catch (error) {
      console.error('[SearchService] Error updating changed files:', error)
      // On error, try to refresh the entire cache as fallback
      try {
        await this.cacheProjectFiles(projectId, true)
      } catch (refreshError) {
        console.error('[SearchService] Failed to refresh cache:', refreshError)
      }
    }
  }

  // Fetch and cache a single file
  private async fetchAndCacheFile(projectId: string, filePath: string): Promise<void> {
    // Normalize the file path (remove leading ./ if present)
    const normalizedPath = filePath.startsWith('./') ? filePath.slice(2) : filePath

    try {
      const response = await fetch('/api/sandbox-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          action: 'file',
          filePath: normalizedPath,
        }),
      })

      if (!response.ok) {
        console.error(`[SearchService] Failed to fetch file ${normalizedPath}: ${response.status}`)
        return
      }

      const data = await response.json()
      const content = data.content || ''

      await fileCache.cacheFile({
        projectId,
        filePath: normalizedPath,
        content,
        lastModified: Date.now(),
        size: content.length,
      })
    } catch (error) {
      console.error(`[SearchService] Error fetching file ${normalizedPath}:`, error)
    }
  }

  // Remove files from IndexedDB (for deleted files)
  async removeDeletedFiles(projectId: string, deletedFiles: string[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize(projectId)
    }

    try {
      for (const filePath of deletedFiles) {
        await fileCache.removeFile(projectId, filePath)
      }
    } catch (error) {
      console.error('[SearchService] Error removing deleted files:', error)
    }
  }

  // Force refresh the entire cache for a specific project
  async forceRefreshCache(projectId: string): Promise<void> {
    this.refreshedProjects.delete(projectId) // Reset flag to force fresh data
    await this.cacheProjectFiles(projectId, true)
  }

  // Debug helper: Clear all caches and force refresh
  async debugClearAndRefresh(projectId: string): Promise<void> {
    this.refreshedProjects.delete(projectId)
    await this.clearProjectCache(projectId)
    await this.cacheProjectFiles(projectId, true)
  }

  // Clear ALL caches (all projects) - for debugging
  async clearAllCaches(): Promise<void> {
    this.refreshedProjects.clear()
    await fileCache.clearAllCache()
  }

  // Debug: Show cache contents
  async debugCacheContents(): Promise<void> {
    await fileCache.debugCacheContents()
  }
}

// Export singleton instance
export const searchService = new SearchService()
