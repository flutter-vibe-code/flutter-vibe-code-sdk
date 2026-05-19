'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, FileText } from 'lucide-react'
import { useLocalStorage } from '@/hooks/use-local-storage'

export interface SubmissionEntry {
  id: string
  appName: string
  bundleId: string
  status: 'building' | 'submitted' | 'failed'
  createdAt: string
  submissionUrl?: string
}

interface AppStoreSubmissionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onNewSubmission: () => void
}

const STATUS_CONFIG: Record<
  SubmissionEntry['status'],
  { label: string; className: string }
> = {
  building: {
    label: 'Building',
    className:
      'bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/15',
  },
  submitted: {
    label: 'Submitted',
    className:
      'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/15',
  },
  failed: {
    label: 'Failed',
    className:
      'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/15',
  },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Add a submission entry to localStorage for a given project.
 */
export function addSubmission(
  projectId: string,
  submission: SubmissionEntry
): void {
  const key = `app_store_submissions_${projectId}`
  try {
    const existing = window.localStorage.getItem(key)
    const entries: SubmissionEntry[] = existing ? JSON.parse(existing) : []
    entries.unshift(submission)
    window.localStorage.setItem(key, JSON.stringify(entries))
  } catch (error) {
    console.warn(`Error writing to localStorage key "${key}":`, error)
  }
}

export function AppStoreSubmissionsModal({
  open,
  onOpenChange,
  projectId,
  onNewSubmission,
}: AppStoreSubmissionsModalProps) {
  const [submissions] = useLocalStorage<SubmissionEntry[]>(
    `app_store_submissions_${projectId}`,
    []
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-5 w-5 text-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <DialogTitle>App Store Submissions</DialogTitle>
          </div>
          <DialogDescription>
            Manage your App Store submissions and create new ones
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No submissions yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first submission to get started.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[320px]">
              <div className="space-y-2">
                {submissions.map((submission) => {
                  const statusConfig = STATUS_CONFIG[submission.status]
                  return (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {submission.appName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {submission.bundleId}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <Badge
                          variant="outline"
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(submission.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onNewSubmission} className="gap-2">
            <Plus className="h-4 w-4" />
            New Submission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
