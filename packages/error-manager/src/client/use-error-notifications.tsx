'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getPusherClient } from '@flutter-vibe-code/pusher/client'
import type { ErrorNotification } from '../shared/types'
import { SENSITIVE_PATTERNS } from '../shared/patterns'

interface UseErrorNotificationsOptions {
  /** Callback when user clicks "Send to Fix" */
  onSendToFix?: (message: string) => void
  /** Custom channel name (defaults to `${projectId}-errors`) */
  channelName?: string
  /** Whether to deduplicate consecutive identical errors */
  deduplicate?: boolean
}

interface UseErrorNotificationsReturn {
  /** The latest error to display (null if dismissed) */
  latestError: ErrorNotification | null
  /** Dismiss the latest error card */
  dismissError: () => void
  /** Report an error from an external source (e.g. health check detecting Expo error page) */
  reportError: (message: string) => void
  /** Whether the error details modal is open */
  isModalOpen: boolean
  /** Current error data for the modal */
  errorModalData: ErrorNotification | null
  /** Close the error modal */
  handleCloseModal: () => void
  /** Send error message to fix callback */
  handleSendToFix: (message: string) => void
  /** All received errors in this session */
  errors: ErrorNotification[]
  /** Clear all errors */
  clearErrors: () => void
}

/**
 * Hook for receiving and displaying real-time error notifications.
 * Supports both Pusher-based notifications (from server-side error detection)
 * and manual error reporting (from health check / Expo error page detection).
 */
export function useErrorNotifications(
  projectId: string | null,
  options: UseErrorNotificationsOptions = {}
): UseErrorNotificationsReturn {
  const {
    onSendToFix,
    channelName: customChannelName,
    deduplicate = true,
  } = options

  const [latestError, setLatestError] = useState<ErrorNotification | null>(null)
  const [errorModalData, setErrorModalData] = useState<ErrorNotification | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errors, setErrors] = useState<ErrorNotification[]>([])
  const lastErrorMessageRef = useRef<string | null>(null)

  const handleSendToFix = useCallback(
    (message: string) => {
      const errorFixMessage = `Fix this error:\n\`\`\`\n${message}\n\`\`\``
      onSendToFix?.(errorFixMessage)
      setLatestError(null)
    },
    [onSendToFix]
  )

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const dismissError = useCallback(() => {
    setLatestError(null)
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
    setLatestError(null)
    lastErrorMessageRef.current = null
  }, [])

  /** Report an error from an external source (e.g. health check detecting Expo error page) */
  const reportError = useCallback((message: string) => {
    if (deduplicate && lastErrorMessageRef.current === message) {
      return
    }
    lastErrorMessageRef.current = message
    const notification: ErrorNotification = {
      message,
      timestamp: new Date().toISOString(),
      projectId: projectId || '',
      type: 'runtime-error',
      source: 'expo-server',
    }
    setErrors((prev) => [...prev, notification])
    setLatestError(notification)
  }, [projectId, deduplicate])

  useEffect(() => {
    if (!projectId) {
      return
    }

    const channelName = customChannelName || `${projectId}-errors`
    const pusherClient = getPusherClient()
    const channel = pusherClient.subscribe(channelName)

    channel.bind('pusher:subscription_succeeded', () => {
      console.log(
        '[useErrorNotifications] Successfully subscribed to channel:',
        channelName
      )
    })

    channel.bind('pusher:subscription_error', (error: unknown) => {
      console.error('[useErrorNotifications] Subscription error:', error)
    })

    console.log('[useErrorNotifications] Binding to error-notification events on channel:', channelName)

    channel.bind('error-notification', (data: ErrorNotification) => {
      console.log('[useErrorNotifications] Received error notification:', data.message?.substring(0, 80))

      // Skip errors with sensitive information
      if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(data.message))) {
        console.log('[useErrorNotifications] Skipping error with sensitive info')
        return
      }

      // Check if this is the same error as the last one shown (deduplication)
      if (deduplicate && lastErrorMessageRef.current === data.message) {
        console.log('[useErrorNotifications] Skipping duplicate error')
        return
      }

      lastErrorMessageRef.current = data.message
      setErrors((prev) => [...prev, data])
      setLatestError(data)
    })

    return () => {
      channel.unbind('error-notification')
      channel.unbind('pusher:subscription_succeeded')
      channel.unbind('pusher:subscription_error')
      pusherClient.unsubscribe(channelName)
      lastErrorMessageRef.current = null
    }
  }, [
    projectId,
    customChannelName,
    deduplicate,
  ])

  return {
    latestError,
    dismissError,
    reportError,
    isModalOpen,
    errorModalData,
    handleCloseModal,
    handleSendToFix,
    errors,
    clearErrors,
  }
}

/**
 * Format error message for sending to chat/fix
 */
export function formatErrorForFix(message: string): string {
  return `Fix this error:\n\`\`\`\n${message}\n\`\`\``
}
