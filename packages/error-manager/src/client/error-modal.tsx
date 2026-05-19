'use client'

import React from 'react'
import type { ErrorNotification } from '../shared/types'

interface ErrorModalProps {
  error: ErrorNotification | null
  isOpen: boolean
  onClose: () => void
  onSendToFix: (message: string) => void
}

/**
 * Modal for displaying full error details
 */
export function ErrorModal({
  error,
  isOpen,
  onClose,
  onSendToFix,
}: ErrorModalProps) {
  if (!isOpen || !error) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-50 w-full max-w-2xl max-h-[85vh] mx-4 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <h2 className="text-lg font-semibold text-foreground">Error Details</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            {error.type && (
              <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10">
                {error.type}
              </span>
            )}
            {error.source && (
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/10">
                {error.source}
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 ring-1 ring-inset ring-gray-500/10">
              {new Date(error.timestamp).toLocaleString()}
            </span>
          </div>

          {/* Error message */}
          <div className="rounded-lg bg-muted p-4">
            <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
              {error.message}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSendToFix(error.message)
              onClose()
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="22" x2="11" y1="2" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Send to Fix
          </button>
        </div>
      </div>
    </div>
  )
}
