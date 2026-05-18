'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@flutter-vibe-code/ui/components/dialog'
import { Button } from '@flutter-vibe-code/ui/components/button'
import { Badge } from '@flutter-vibe-code/ui/components/badge'
import { AlertTriangle, GitCommit, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { Commit, RestoreConfirmationModalProps } from '../types'

export function RestoreConfirmationModal({
  open,
  onOpenChange,
  commit,
  onConfirm,
}: RestoreConfirmationModalProps) {
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoreStatus, setRestoreStatus] = useState<string>('')

  // Reset state when modal closes or opens with new commit
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setError(null)
      setRestoreStatus('')
    }
    onOpenChange(newOpen)
  }

  const handleConfirm = async () => {
    if (!commit) return

    setIsRestoring(true)
    setError(null)
    setRestoreStatus('Restoring files...')

    try {
      await onConfirm(commit)
      setRestoreStatus('Restore completed successfully!')

      // Small delay to show success message before closing
      await new Promise((resolve) => setTimeout(resolve, 500))

      handleOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore commit')
      setRestoreStatus('')
    } finally {
      setIsRestoring(false)
    }
  }

  if (!commit) return null

  const commitDate = new Date(commit.date)
  const formattedDate = commitDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Restore to Previous Version?
          </DialogTitle>
          <DialogDescription>
            This will restore your codebase to the state of this commit. Current
            uncommitted changes may be lost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Commit Details */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Commit Hash
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {commit.shortHash}
                </Badge>
              </div>
              <p className="text-sm font-medium">
                {commit.displayMessage || commit.message}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                by <span className="font-medium">{commit.author}</span>
              </span>
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20 p-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                This action will:
              </p>
              <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                <li>Restore all files to this commit's state</li>
                <li>Clear Metro cache and restart the server</li>
                <li>Discard any uncommitted changes</li>
              </ul>
            </div>
          </div>

          {/* Status message */}
          {isRestoring && restoreStatus && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {restoreStatus}
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isRestoring}>
            {isRestoring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              'Restore'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
