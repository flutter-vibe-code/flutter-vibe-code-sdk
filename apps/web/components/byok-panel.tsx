'use client'

/**
 * Multi-provider BYOK panel.
 *
 * One card per Anthropic-compat provider in the catalog. Each card holds:
 *   - Masked API key input with reveal toggle
 *   - Save / clear / docs link
 *   - Status pill (Configured · Empty · Server-side fallback)
 *
 * Keys are stored under `byok_keys` (record by provider id) plus the legacy
 * `byok_anthropic_key` / `byok_moonshot_key` for backward compat with
 * existing callers in claude-code-handler.
 */

import { useEffect, useMemo, useState } from 'react'
import * as React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  PROVIDER_LIST,
  type AnthropicCompatProvider,
  type ProviderId,
} from '@/lib/anthropic-providers'
import {
  CheckCircle2,
  X,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  ShieldCheck,
  Server,
} from 'lucide-react'

const STORAGE_BYOK = 'byok_keys'
const STORAGE_LEGACY_ANTHROPIC = 'byok_anthropic_key'
const STORAGE_LEGACY_MOONSHOT = 'byok_moonshot_key'

const PROVIDER_ACCENT: Record<ProviderId, string> = {
  anthropic: 'from-orange-500/20 to-orange-600/10 ring-orange-500/30',
  deepseek: 'from-blue-500/20 to-indigo-600/10 ring-blue-500/30',
  minimax: 'from-purple-500/20 to-fuchsia-600/10 ring-purple-500/30',
  moonshot: 'from-amber-500/20 to-orange-600/10 ring-amber-500/30',
  openrouter: 'from-emerald-500/20 to-teal-600/10 ring-emerald-500/30',
}

interface ByokPanelProps {
  onClose: () => void
}

interface KeyState {
  saved: string | null
  draft: string
  reveal: boolean
}

function readAllKeys(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_BYOK)
    const parsed = raw ? JSON.parse(raw) : {}
    // Migrate legacy single-key storage on first read.
    const legacyA = localStorage.getItem(STORAGE_LEGACY_ANTHROPIC)
    const legacyM = localStorage.getItem(STORAGE_LEGACY_MOONSHOT)
    if (legacyA && !parsed.anthropic) parsed.anthropic = legacyA
    if (legacyM && !parsed.moonshot) parsed.moonshot = legacyM
    return parsed
  } catch {
    return {}
  }
}

function writeKey(providerId: ProviderId, key: string | null) {
  if (typeof window === 'undefined') return
  const all = readAllKeys()
  if (key) all[providerId] = key
  else delete all[providerId]
  localStorage.setItem(STORAGE_BYOK, JSON.stringify(all))
  // Mirror to legacy slots so the existing claude-code-handler `anthropicKey` /
  // `moonshotKey` paths keep working until we drop them.
  if (providerId === 'anthropic') {
    if (key) localStorage.setItem(STORAGE_LEGACY_ANTHROPIC, key)
    else localStorage.removeItem(STORAGE_LEGACY_ANTHROPIC)
  }
  if (providerId === 'moonshot') {
    if (key) localStorage.setItem(STORAGE_LEGACY_MOONSHOT, key)
    else localStorage.removeItem(STORAGE_LEGACY_MOONSHOT)
  }
}

function maskKey(k: string) {
  if (!k) return ''
  if (k.length <= 12) return '••••••••'
  return `${k.slice(0, 4)}${'•'.repeat(Math.min(k.length - 8, 32))}${k.slice(-4)}`
}

// ────────────────────────────────────────────────────────────────────────────
// One card per provider
// ────────────────────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  state,
  onChange,
  onSave,
  onClear,
  onToggleReveal,
}: {
  provider: AnthropicCompatProvider
  state: KeyState
  onChange: (v: string) => void
  onSave: () => void
  onClear: () => void
  onToggleReveal: () => void
}) {
  const isConfigured = !!state.saved
  const dirty = state.draft.trim().length > 0 && state.draft !== state.saved

  const placeholder = useMemo(() => {
    switch (provider.id) {
      case 'anthropic':
        return 'sk-ant-…'
      case 'deepseek':
        return 'sk-…'
      case 'minimax':
        return 'eyJh… or sk-…'
      case 'moonshot':
        return 'sk-…'
      case 'openrouter':
        return 'sk-or-…'
      default:
        return 'API key'
    }
  }, [provider.id])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-md transition-all',
        'hover:border-border hover:bg-card/60',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
      )}
    >
      {/* Accent halo */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          PROVIDER_ACCENT[provider.id],
        )}
      />
      <div className="relative flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {provider.name}
              </span>
              {isConfigured ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" />
                  Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border/60">
                  <Server className="h-3 w-3" />
                  Server fallback
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {provider.baseURL ?? 'native (api.anthropic.com)'}
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              {provider.models.length} model{provider.models.length === 1 ? '' : 's'}
            </div>
          </div>
          {provider.docsUrl && (
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              Docs
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Saved key display */}
        {isConfigured && state.draft === '' && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
            <span className="font-mono text-[12px] text-muted-foreground tracking-tight truncate">
              {maskKey(state.saved!)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={onClear}
                aria-label="Clear key"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Editor */}
        {(!isConfigured || state.draft !== '') && (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input
                type={state.reveal ? 'text' : 'password'}
                value={state.draft}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pr-9 font-mono text-[12px] tracking-tight"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={onToggleReveal}
                className="absolute inset-y-0 right-0 grid w-9 place-items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={state.reveal ? 'Hide key' : 'Reveal key'}
              >
                {state.reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-end gap-2">
              {isConfigured && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-[11px]"
                  onClick={() => onChange('')}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                disabled={!dirty}
                onClick={onSave}
                className="h-7 px-3 text-[11px] font-medium"
              >
                {isConfigured ? 'Update' : 'Save'} key
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Panel
// ────────────────────────────────────────────────────────────────────────────

export function ByokPanel({ onClose }: ByokPanelProps) {
  const reduceMotion = useReducedMotion()
  const [states, setStates] = useState<Record<string, KeyState>>(() => {
    const all = readAllKeys()
    const out: Record<string, KeyState> = {}
    for (const p of PROVIDER_LIST) {
      out[p.id] = { saved: all[p.id] || null, draft: '', reveal: false }
    }
    return out
  })

  // Re-hydrate post-mount in case storage changed (cross-tab).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_BYOK) {
        const all = readAllKeys()
        setStates((prev) => {
          const next = { ...prev }
          for (const p of PROVIDER_LIST) {
            next[p.id] = { ...next[p.id], saved: all[p.id] || null }
          }
          return next
        })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = (id: ProviderId, patch: Partial<KeyState>) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }
  const save = (id: ProviderId) => {
    const draft = states[id].draft.trim()
    if (!draft) return
    writeKey(id, draft)
    setStates((prev) => ({ ...prev, [id]: { saved: draft, draft: '', reveal: false } }))
  }
  const clear = (id: ProviderId) => {
    writeKey(id, null)
    setStates((prev) => ({ ...prev, [id]: { saved: null, draft: '', reveal: false } }))
  }

  const configuredCount = useMemo(
    () => Object.values(states).filter((s) => s.saved).length,
    [states],
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/30 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 ring-1 ring-inset ring-border">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Bring Your Own Keys</h2>
            <p className="text-[11px] text-muted-foreground">
              {configuredCount > 0
                ? `${configuredCount} of ${PROVIDER_LIST.length} provider${PROVIDER_LIST.length === 1 ? '' : 's'} configured`
                : `Use any of ${PROVIDER_LIST.length} Anthropic-compatible providers`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-lg"
          aria-label="Close BYOK panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="px-5 pt-3">
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-[11px] text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
          <span>
            Keys live only in your browser&apos;s localStorage. Each request sends the relevant key once
            in <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-[10px]">ANTHROPIC_AUTH_TOKEN</code>.
            We never persist them on the server.
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">
        <div className="grid grid-cols-1 gap-2.5">
          <AnimatePresence initial={false}>
            {PROVIDER_LIST.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                state={states[p.id]}
                onChange={(v) => update(p.id as ProviderId, { draft: v })}
                onSave={() => save(p.id as ProviderId)}
                onClear={() => clear(p.id as ProviderId)}
                onToggleReveal={() => update(p.id as ProviderId, { reveal: !states[p.id].reveal })}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ByokPanel
