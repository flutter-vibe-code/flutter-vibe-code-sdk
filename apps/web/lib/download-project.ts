/**
 * Single source of truth for the "Download project as zip" flow.
 *
 * Sonner's `toast.loading()` returns an id; passing `{ id }` to subsequent
 * `toast.success` / `toast.error` updates THE SAME toast instead of stacking
 * new ones. That gives the user a persistent spinner that converts to a
 * success/error message when the request finishes — instead of an info toast
 * that disappears after 4s leaving them in the dark while the zip generates.
 */

import { toast as sonnerToast } from 'sonner'

type ToastApi = typeof sonnerToast

interface DownloadOpts {
  projectId: string | null | undefined
  userID: string | null | undefined
  projectTitle?: string | null
  /** Pass the toast object in if the caller uses `useToast()`; defaults to sonner's singleton. */
  toast?: ToastApi
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_]/g, '_')
}

export async function downloadProject({
  projectId,
  userID,
  projectTitle,
  toast = sonnerToast,
}: DownloadOpts): Promise<void> {
  if (!projectId || !userID) {
    toast.error('Unable to download project — missing project or user id')
    return
  }

  const toastId = toast.loading('Preparing download…', {
    description: 'Compressing project files from the sandbox',
  })

  try {
    const downloadUrl = `/api/projects/${projectId}/download?userID=${userID}`
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      let detail = ''
      try {
        const errBody = await response.json()
        detail = errBody.error || errBody.details || ''
      } catch {
        detail = await response.text().catch(() => '')
      }
      toast.error('Failed to download project', {
        id: toastId,
        description: detail || `HTTP ${response.status}`,
      })
      console.error('[Download] API error:', detail || response.status)
      return
    }

    toast.loading('Downloading…', {
      id: toastId,
      description: 'Saving the archive to your device',
    })

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeFilename(projectTitle || 'project')}-${projectId}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Downloaded ${fmtSize(blob.size)}`, {
      id: toastId,
      description: a.download,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Download] Exception:', error)
    toast.error('Failed to download project', { id: toastId, description: message })
  }
}
