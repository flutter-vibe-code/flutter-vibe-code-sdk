'use client'

import { Badge } from '@flutter-vibe-code/ui/components/badge'
import { Button } from '@flutter-vibe-code/ui/components/button'
import { ScrollArea } from '@flutter-vibe-code/ui/components/scroll-area'
import { GitCommit, Clock, User, RotateCcw, AlertCircle } from 'lucide-react'
import { useState, memo } from 'react'
import { RestoreConfirmationModal } from './restore-confirmation-modal'
import { useCommitHistory } from '../hooks/use-commit-history'
import { useRestoreCommit } from '../hooks/use-restore-commit'
import type { Commit, HistoryPanelProps } from '../types'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export const HistoryPanel = memo(function HistoryPanel({
  projectId,
  sandboxId,
  userId,
  onChatReload,
  onPreviewRefresh,
}: HistoryPanelProps) {
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { commits, error, isLoading, refetch } = useCommitHistory({
    projectId,
    sandboxId,
    userId,
  })

  const { restoreCommit, isRestoring } = useRestoreCommit({
    projectId,
    sandboxId,
    userId,
    onChatReload,
    onPreviewRefresh,
    onSuccess: () => {
      refetch()
    },
  })

  const handleCommitClick = (commit: Commit) => {
    setSelectedCommit(commit)
    setIsModalOpen(true)
  }

  const handleRestoreCommit = async (commit: Commit) => {
    await restoreCommit(commit)
  }

  return (
    <>
      <div className="flex flex-col h-full border-r">
        <div className="flex-1 overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm font-medium mb-2">
                Failed to load commit history
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : commits.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <GitCommit className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm font-medium mb-2">No commits yet</p>
              <p className="text-xs text-muted-foreground">
                Commits will appear here as you make changes to your project
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {commits.map((commit) => (
                  <button
                    key={commit.hash}
                    onClick={() => handleCommitClick(commit)}
                    className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                  >
                    <div className="space-y-2">
                      {/* Commit message and restore button */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-foreground">
                            {commit.displayMessage || commit.message}
                          </p>
                        </div>
                        <RotateCcw className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {commit.shortHash}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">
                            {commit.author}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(commit.date)}</span>
                        </div>
                      </div>

                      {/* Message ID badge if available */}
                      {commit.messageId && (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            Message: {commit.messageId.slice(0, 8)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      <RestoreConfirmationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        commit={selectedCommit}
        onConfirm={handleRestoreCommit}
      />
    </>
  )
})
