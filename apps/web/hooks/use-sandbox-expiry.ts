'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface SandboxExpiryState {
  loading: boolean
  isRunning: boolean
  startedAt: Date | null
  endsAt: Date | null
  remainingMs: number | null
  error: string | null
}

const POLL_INTERVAL_MS = 60_000 // 1 min; sandboxes have 1h+ lifetime so a minute is fine.

/**
 * Polls /api/sandbox-status for the project's current sandbox lifetime.
 * Exposes remainingMs (ms until endAt) so the UI can render an expiry banner.
 *
 * extend() POSTs /api/sandbox/extend → refreshes immediately on success.
 */
export function useSandboxExpiry(projectId?: string | null, userID?: string | null) {
  const [state, setState] = useState<SandboxExpiryState>({
    loading: false,
    isRunning: false,
    startedAt: null,
    endsAt: null,
    remainingMs: null,
    error: null,
  })

  // Re-render every 30s so the countdown text ticks down between polls.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const fetchStatus = useCallback(async () => {
    if (!projectId || !userID) return
    setState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch('/api/sandbox-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userID }),
      })
      const data = await res.json()
      const endsAt = data.endAt ? new Date(data.endAt) : null
      const startedAt = data.startedAt ? new Date(data.startedAt) : null
      setState({
        loading: false,
        isRunning: !!data.isRunning,
        startedAt,
        endsAt,
        remainingMs: endsAt ? endsAt.getTime() - Date.now() : null,
        error: data.error || null,
      })
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }))
    }
  }, [projectId, userID])

  // Initial fetch + polling.
  const startedRef = useRef(false)
  useEffect(() => {
    if (!projectId || !userID) return
    if (startedRef.current) return
    startedRef.current = true
    fetchStatus()
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS)
    return () => {
      clearInterval(id)
      startedRef.current = false
    }
  }, [projectId, userID, fetchStatus])

  // Live countdown without re-fetching: derive remaining from endsAt.
  const remainingMs = state.endsAt ? state.endsAt.getTime() - Date.now() : state.remainingMs

  const extend = useCallback(async () => {
    if (!projectId || !userID) return { ok: false as const, error: 'No project' }
    try {
      const res = await fetch('/api/sandbox/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userID }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false as const, error: data.error || 'Failed to extend' }
      await fetchStatus()
      return { ok: true as const, endAt: data.endAt }
    } catch (e) {
      return { ok: false as const, error: (e as Error).message }
    }
  }, [projectId, userID, fetchStatus])

  return { ...state, remainingMs, refresh: fetchStatus, extend }
}
