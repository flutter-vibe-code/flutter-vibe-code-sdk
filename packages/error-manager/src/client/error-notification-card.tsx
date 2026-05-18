'use client'

import { useEffect, useRef, useState } from 'react'
import type { ErrorNotification } from '../shared/types'

interface ErrorNotificationCardProps {
  error: ErrorNotification
  onDismiss: () => void
  onSendToFix: (message: string) => void
  onViewDetails: () => void
}

/**
 * Inline error notification card that floats above the chat input panel.
 * Uses ResizeObserver to measure [data-chat-input] height for positioning.
 */
export function ErrorNotificationCard({
  error,
  onDismiss,
  onSendToFix,
  onViewDetails,
}: ErrorNotificationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [bottomOffset, setBottomOffset] = useState(0)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const container = card.parentElement
    if (!container) return

    const inputEl = container.querySelector('[data-chat-input]')
    if (!inputEl) return

    const updateOffset = () => {
      setBottomOffset(inputEl.getBoundingClientRect().height)
    }

    updateOffset()

    const observer = new ResizeObserver(updateOffset)
    observer.observe(inputEl)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={cardRef} className="absolute left-0 right-0 z-10 mx-2 mb-2 bg-red-50 dark:bg-red-950 border-2 border-destructive rounded-lg p-3 shadow-lg animate-in slide-in-from-bottom-2 duration-300" style={{ bottom: bottomOffset }}>
      <div className="flex items-start gap-2">
        <svg className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-destructive">Error Found</div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words font-mono">
            {error.message.substring(0, 200)}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onSendToFix(error.message)}
              className="inline-flex items-center gap-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-3"
            >
              Send to Fix
            </button>
            <button
              onClick={onViewDetails}
              className="inline-flex items-center gap-1 rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-3"
            >
              Details
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-sm opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}
