'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// Generic message type that works with any AI SDK version
interface BaseMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content?: string
}

interface UseStreamRecoveryOptions {
  /** The current messages from useChat */
  messages: BaseMessage[]
  /** Current streaming status from useChat */
  status: 'streaming' | 'error' | 'submitted' | 'ready'
  /** Whether chat is loading */
  isLoading: boolean
  /** Project ID for fetching messages */
  projectId: string | null
  /** User ID for fetching messages */
  userId: string | null
  /** Callback to set messages (from useChat) - accepts any message array type */
  setMessages: (messages: any[] | ((prev: any[]) => any[])) => void
  /** How long to wait before considering stream stalled (ms) */
  stallTimeoutMs?: number
  /** Whether to enable auto-recovery */
  enabled?: boolean
}

interface UseStreamRecoveryResult {
  /** Whether we're currently recovering from a stalled stream */
  isRecovering: boolean
  /** Number of times we've recovered in this session */
  recoveryCount: number
  /** Last time we successfully recovered */
  lastRecoveryTime: Date | null
  /** Manually trigger a recovery (fetch latest messages) */
  triggerRecovery: () => Promise<boolean>
}

/**
 * Hook that monitors streaming health and auto-recovers when streams stall.
 *
 * When streaming appears stalled (no new content for stallTimeoutMs while status is "streaming"),
 * it fetches the latest messages from the database and updates the UI.
 */
export function useStreamRecovery({
  messages,
  status,
  isLoading,
  projectId,
  userId,
  setMessages,
  stallTimeoutMs = 30000, // 30 seconds default
  enabled = true,
}: UseStreamRecoveryOptions): UseStreamRecoveryResult {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryCount, setRecoveryCount] = useState(0)
  const [lastRecoveryTime, setLastRecoveryTime] = useState<Date | null>(null)

  // Track the last message content length to detect stalls
  const lastContentLengthRef = useRef(0)
  const lastActivityTimeRef = useRef(Date.now())
  const stallCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRecoveringRef = useRef(false) // Prevent concurrent recovery attempts

  // Get the current content length of the last assistant message
  const getCurrentContentLength = useCallback(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant') {
      return lastMessage.content?.length || 0
    }
    return 0
  }, [messages])

  // Fetch latest messages from the database
  const fetchLatestMessages = useCallback(async (): Promise<BaseMessage[] | null> => {
    if (!projectId || !userId) {
      console.log('[StreamRecovery] Cannot fetch: missing projectId or userId')
      return null
    }

    try {
      const response = await fetch(`/api/messages?projectId=${projectId}&userId=${userId}`)
      if (!response.ok) {
        console.error('[StreamRecovery] Failed to fetch messages:', response.status)
        return null
      }

      const data = await response.json()
      return data.messages as BaseMessage[]
    } catch (error) {
      console.error('[StreamRecovery] Error fetching messages:', error)
      return null
    }
  }, [projectId, userId])

  // Trigger recovery - fetch latest messages and update UI
  const triggerRecovery = useCallback(async (): Promise<boolean> => {
    if (isRecoveringRef.current) {
      console.log('[StreamRecovery] Recovery already in progress')
      return false
    }

    console.log('[StreamRecovery] Triggering recovery...')
    isRecoveringRef.current = true
    setIsRecovering(true)

    try {
      const latestMessages = await fetchLatestMessages()

      if (latestMessages && latestMessages.length > 0) {
        // Check if we actually got new content
        const latestAssistantMsg = latestMessages.filter(m => m.role === 'assistant').pop()
        const currentAssistantMsg = messages.filter(m => m.role === 'assistant').pop()

        const latestContent = latestAssistantMsg?.content || ''
        const currentContent = currentAssistantMsg?.content || ''

        if (latestContent.length > currentContent.length) {
          console.log('[StreamRecovery] Found newer content, updating messages', {
            currentLength: currentContent.length,
            newLength: latestContent.length,
          })

          // Update messages with the latest from DB
          setMessages(latestMessages)
          setRecoveryCount(prev => prev + 1)
          setLastRecoveryTime(new Date())

          return true
        } else {
          console.log('[StreamRecovery] No newer content available')
        }
      }

      return false
    } catch (error) {
      console.error('[StreamRecovery] Recovery failed:', error)
      return false
    } finally {
      isRecoveringRef.current = false
      setIsRecovering(false)
    }
  }, [fetchLatestMessages, messages, setMessages])

  // Monitor for stalled streams
  useEffect(() => {
    if (!enabled) {
      return
    }

    // Update activity time when content changes
    const currentLength = getCurrentContentLength()
    if (currentLength !== lastContentLengthRef.current) {
      lastContentLengthRef.current = currentLength
      lastActivityTimeRef.current = Date.now()
    }

    // Only monitor when actively streaming
    if (status !== 'streaming' || !isLoading) {
      // Clear any existing interval
      if (stallCheckIntervalRef.current) {
        clearInterval(stallCheckIntervalRef.current)
        stallCheckIntervalRef.current = null
      }
      return
    }

    // Set up stall detection
    if (!stallCheckIntervalRef.current) {
      stallCheckIntervalRef.current = setInterval(() => {
        const timeSinceActivity = Date.now() - lastActivityTimeRef.current
        const currentLen = getCurrentContentLength()

        // Check if we have content and it's stalled
        if (currentLen > 0 && timeSinceActivity > stallTimeoutMs) {
          console.log('[StreamRecovery] Stream appears stalled', {
            timeSinceActivity,
            contentLength: currentLen,
            stallTimeoutMs,
          })

          // Attempt recovery
          triggerRecovery()

          // Reset activity time to prevent rapid retries
          lastActivityTimeRef.current = Date.now()
        }
      }, 5000) // Check every 5 seconds
    }

    return () => {
      if (stallCheckIntervalRef.current) {
        clearInterval(stallCheckIntervalRef.current)
        stallCheckIntervalRef.current = null
      }
    }
  }, [enabled, status, isLoading, getCurrentContentLength, stallTimeoutMs, triggerRecovery])

  return {
    isRecovering,
    recoveryCount,
    lastRecoveryTime,
    triggerRecovery,
  }
}
