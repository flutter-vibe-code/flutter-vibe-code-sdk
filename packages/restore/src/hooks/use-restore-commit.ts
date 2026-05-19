'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Commit, GitRestoreResponse } from '../types'

interface UseRestoreCommitOptions {
  projectId?: string
  sandboxId?: string
  userId?: string
  onChatReload?: () => Promise<void>
  onPreviewRefresh?: (urls: { url: string; e2bUrl?: string }) => void
  onSuccess?: () => void
  onError?: (error: Error) => void
  /** Custom API endpoint (defaults to /api/git-restore) */
  apiEndpoint?: string
}

interface UseRestoreCommitResult {
  restoreCommit: (commit: Commit) => Promise<void>
  isRestoring: boolean
  error: Error | null
  reset: () => void
}

export function useRestoreCommit({
  projectId,
  sandboxId,
  userId,
  onChatReload,
  onPreviewRefresh,
  onSuccess,
  onError,
  apiEndpoint = '/api/git-restore',
}: UseRestoreCommitOptions): UseRestoreCommitResult {
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const queryClient = useQueryClient()

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const restoreCommit = useCallback(
    async (commit: Commit) => {
      if (!projectId || !sandboxId || !userId) {
        const err = new Error('Missing required data for restore')
        setError(err)
        onError?.(err)
        throw err
      }

      setIsRestoring(true)
      setError(null)

      try {
        // Prefer messageId if available (for commits with messageId format),
        // otherwise use the full commit hash which will be validated by the API
        const messageId = commit.messageId || commit.hash

        console.log('[useRestoreCommit] Restoring commit:', {
          hash: commit.hash,
          shortHash: commit.shortHash,
          messageId: commit.messageId,
          usingMessageId: messageId,
        })

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            sandboxId,
            userID: userId,
            messageId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to restore commit')
        }

        const data: GitRestoreResponse = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Restore failed')
        }

        // Step 1: If chat messages were deleted, reload chat history from API
        if (data.shouldReloadChat && onChatReload) {
          console.log(
            '[useRestoreCommit] Reloading chat history (deleted',
            data.deletedMessagesCount,
            'messages)...'
          )
          await onChatReload()
        }

        // Step 2: If server was restarted, update preview with new URLs
        if (data.shouldRefreshPreview && data.serverRestarted && onPreviewRefresh) {
          onPreviewRefresh({
            url: data.serverUrl!,
            e2bUrl: data.e2bUrl,
          })
        }

        // Step 3: Wait a bit for git operations to settle, then invalidate query to refetch
        await new Promise((resolve) => setTimeout(resolve, 1000))

        await queryClient.invalidateQueries({
          queryKey: ['commits', projectId, sandboxId, userId],
        })

        onSuccess?.()
      } catch (err) {
        console.error('[useRestoreCommit] Error restoring commit:', err)
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        onError?.(error)
        throw err
      } finally {
        setIsRestoring(false)
      }
    },
    [projectId, sandboxId, userId, apiEndpoint, onChatReload, onPreviewRefresh, onSuccess, onError, queryClient]
  )

  return {
    restoreCommit,
    isRestoring,
    error,
    reset,
  }
}
