'use client'

import { useState } from 'react'
import { Clock, RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSandboxExpiry } from '@/hooks/use-sandbox-expiry'

interface Props {
  projectId?: string | null
  userID?: string | null
  /** When remaining drops below this, show the banner. Default 20 min. */
  showBelowMs?: number
  className?: string
}

function fmtMinutes(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60_000))
  if (m < 1) return '<1 min'
  return `${m} min`
}

/**
 * Floating pill that shows the sandbox's remaining lifetime + lets the user
 * extend it back to 1h. Hidden when remaining > showBelowMs (default 20min)
 * or when there's no sandbox info. Color shifts amber → red as it shrinks.
 */
export function SandboxExpiryBanner({
  projectId,
  userID,
  showBelowMs = 20 * 60_000,
  className,
}: Props) {
  const { remainingMs, isRunning, error, extend } = useSandboxExpiry(projectId, userID)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  // Don't render if we don't have useful info yet or there's plenty of time.
  if (remainingMs == null) return null
  if (remainingMs > showBelowMs && isRunning) return null
  if (!isRunning && remainingMs > 0) return null

  const expired = remainingMs <= 0 || !isRunning
  const critical = !expired && remainingMs <= 5 * 60_000
  const warn = !expired && !critical && remainingMs <= 15 * 60_000

  const tone =
    expired
      ? 'bg-red-500/15 text-red-300 ring-red-500/30'
      : critical
        ? 'bg-red-500/12 text-red-200 ring-red-500/25'
        : warn
          ? 'bg-amber-500/12 text-amber-200 ring-amber-500/25'
          : 'bg-emerald-500/12 text-emerald-200 ring-emerald-500/25'

  const handleExtend = async () => {
    setBusy(true)
    setFlash(null)
    const result = await extend()
    setBusy(false)
    if (result.ok) {
      setFlash('Extended +1h')
      setTimeout(() => setFlash(null), 2500)
    } else {
      setFlash(result.error || 'Failed')
      setTimeout(() => setFlash(null), 4000)
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ring-1 backdrop-blur-md shadow-lg',
        tone,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {expired ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      <span>
        {expired
          ? 'Sandbox expired'
          : `Sandbox: ${fmtMinutes(remainingMs)} left`}
      </span>
      {!expired && (
        <button
          type="button"
          onClick={handleExtend}
          disabled={busy}
          className="ml-1 inline-flex items-center gap-1 rounded-md bg-white/8 px-2 py-1 text-[10px] uppercase tracking-wide hover:bg-white/16 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3 w-3', busy && 'animate-spin')} />
          Extend
        </button>
      )}
      {flash && <span className="ml-1 text-[10px] opacity-80">{flash}</span>}
      {error && <span className="ml-1 text-[10px] opacity-60">({error})</span>}
    </div>
  )
}
