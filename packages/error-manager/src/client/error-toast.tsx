'use client'

import React from 'react'
import type { ErrorNotification } from '../shared/types'

interface ErrorToastProps {
  error: ErrorNotification
  onDismiss: () => void
  onSendToFix: (message: string) => void
  onViewDetails: (error: ErrorNotification) => void
}

/**
 * Custom error toast component with send-to-fix and view-details actions
 */
export function ErrorToast({
  error,
  onDismiss,
  onSendToFix,
  onViewDetails,
}: ErrorToastProps) {
  return (
    <div className="w-full bg-background border border-border rounded-lg shadow-lg max-w-md p-4 relative">
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute right-2 padding-0 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <svg
          className="h-4 w-4"
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

      <div className="flex flex-col gap-3">
        {/* Error header and message */}
        <div className="flex items-start gap-2 pr-6">
          {/* Error icon */}
          <svg
            className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
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
          <div className="flex-1">
            <div className="font-semibold text-foreground">Error Found</div>
            <div className="text-sm text-muted-foreground mt-1 break-words mb-2">
              {error.message.substring(0, 150)}...
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              onSendToFix(error.message)
              onDismiss()
            }}
            className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
          >
            {/* Send icon */}
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
          <button
            onClick={() => {
              onViewDetails(error)
              onDismiss()
            }}
            className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
          >
            {/* View icon */}
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}
