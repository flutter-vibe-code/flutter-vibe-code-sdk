'use client'

import PusherClient from 'pusher-js'
import { useEffect, useRef, useState, useCallback } from 'react'

export interface AgentToolEvent {
  status: 'start' | 'end' | 'output'
  toolName?: string
  filePath?: string
  pattern?: string
  commandPreview?: string
  success?: boolean
  output?: string
  timestamp: string
  projectId: string
}

export interface ActiveToolExecution {
  id: string
  toolName: string
  filePath?: string
  pattern?: string
  commandPreview?: string
  status: 'running' | 'success' | 'error'
  startTime: string
}

interface UseAgentToolStreamOptions {
  projectId: string | null
  enabled?: boolean
}

export function useAgentToolStream({
  projectId,
  enabled = true,
}: UseAgentToolStreamOptions) {
  const [activeTools, setActiveTools] = useState<ActiveToolExecution[]>([])
  const pusherRef = useRef<PusherClient | null>(null)
  const channelRef = useRef<any>(null)

  const clearFinishedTools = useCallback(() => {
    setActiveTools((prev) => prev.filter((t) => t.status === 'running'))
  }, [])

  useEffect(() => {
    if (!projectId || !enabled) return

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    pusherRef.current = pusher

    const channel = pusher.subscribe(`project-${projectId}`)
    channelRef.current = channel

    channel.bind('agent-tool-use', (event: AgentToolEvent) => {
      if (event.status === 'start') {
        const id = `${event.toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        setActiveTools((prev) => [
          ...prev,
          {
            id,
            toolName: event.toolName || 'Unknown Tool',
            filePath: event.filePath,
            pattern: event.pattern,
            commandPreview: event.commandPreview,
            status: 'running',
            startTime: event.timestamp,
          },
        ])
      } else if (event.status === 'end') {
        setActiveTools((prev) => {
          // Mark the most recent running tool of the same type as completed
          const reversed = [...prev].reverse()
          const idx = reversed.findIndex(
            (t) => t.status === 'running'
          )
          if (idx === -1) return prev
          const actualIdx = prev.length - 1 - idx
          const updated = [...prev]
          updated[actualIdx] = {
            ...updated[actualIdx],
            status: event.success ? 'success' : 'error',
          }
          return updated
        })

        // Auto-remove finished tools after 3 seconds
        setTimeout(() => {
          setActiveTools((prev) =>
            prev.filter((t) => t.status === 'running')
          )
        }, 3000)
      }
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
      pusherRef.current = null
    }
  }, [projectId, enabled])

  return {
    activeTools,
    clearFinishedTools,
  }
}
