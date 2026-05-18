'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface EditableProjectTitleProps {
  projectTitle?: string
  projectId?: string
  userId?: string
  onTitleUpdate?: (newTitle: string) => void
}

export function EditableProjectTitle({
  projectTitle,
  projectId,
  userId,
  onTitleUpdate,
}: EditableProjectTitleProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(projectTitle || '')
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  // Update edited title when projectTitle changes
  useEffect(() => {
    setEditedTitle(projectTitle || '')
  }, [projectTitle])

  const handleSaveTitle = async () => {
    if (!projectId || !userId) return

    const trimmedTitle = editedTitle.trim()
    if (!trimmedTitle || trimmedTitle === projectTitle) {
      setIsEditingTitle(false)
      setEditedTitle(projectTitle || '')
      return
    }

    setIsSavingTitle(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: trimmedTitle,
          userID: userId,
        }),
      })

      if (response.ok) {
        toast.success('Project title updated successfully')
        setIsEditingTitle(false)
        if (onTitleUpdate) {
          onTitleUpdate(trimmedTitle)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update project title')
        setEditedTitle(projectTitle || '')
      }
    } catch (error) {
      console.error('Error updating project title:', error)
      toast.error('Failed to update project title')
      setEditedTitle(projectTitle || '')
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingTitle(false)
    setEditedTitle(projectTitle || '')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  if (!projectTitle) {
    return null
  }

  return (
    <div className="flex justify-center min-h-[58px] items-center px-3">
      {isEditingTitle ? (
        <div className="flex items-center gap-2 max-w-[400px] w-full">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 text-sm rounded-full px-4"
            autoFocus
            disabled={isSavingTitle}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={handleSaveTitle}
            disabled={isSavingTitle || !editedTitle.trim()}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={handleCancelEdit}
            disabled={isSavingTitle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        // Premium project pill: glass surface, breathing live dot, Flutter
        // badge. Replaces the anonymous gray h2 so the IDE actually announces
        // the active project + status.
        <button
          type="button"
          onClick={() => projectId && setIsEditingTitle(true)}
          title="Click to edit project title"
          className="group inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-card/55 backdrop-blur-md supports-[backdrop-filter]:bg-card/40 px-4 py-1.5 text-sm font-medium text-foreground/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_10px_-4px_rgba(0,0,0,0.06)] transition-all hover:border-border hover:bg-card/75 hover:shadow-[0_6px_20px_-6px_rgba(249,115,22,0.28)]"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/70 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </span>
          <span className="truncate max-w-[260px] tracking-tight">{projectTitle}</span>
          <span className="hidden md:inline-flex h-5 items-center rounded-md bg-orange-500/12 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 ring-1 ring-inset ring-orange-500/25">
            Flutter
          </span>
        </button>
      )}
    </div>
  )
}
