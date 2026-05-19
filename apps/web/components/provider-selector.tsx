'use client'

/**
 * Premium provider + model + effort selector for Flutter Vibe Code.
 *
 * Reads from the @/lib/anthropic-providers catalog and persists user choice
 * per-project in localStorage. Designed as a single popover with three layers:
 *
 *   1. Provider rows (left rail of the popover)
 *   2. Model list for the selected provider (right pane)
 *   3. Effort level + capability filters (bottom pane)
 *
 * Visual language: subtle liquid glass (backdrop-blur + inset highlight),
 * provider accent gradient as a 1px ring on hover, framer-motion springs for
 * the active indicator, lucide-react icons only (anti-emoji policy).
 */

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import * as React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  PROVIDER_LIST,
  PROVIDERS,
  resolveProvider,
  type AnthropicCompatProvider,
  type ProviderId,
  type ProviderModel,
  type EffortLevel,
} from '@/lib/anthropic-providers'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  Brain,
  Sparkles,
  Zap,
  Eye,
  Code2,
  Wrench,
  ChevronDown,
  Check,
  ExternalLink,
  Cpu,
  Gauge,
} from 'lucide-react'

// ────────────────────────────────────────────────────────────────────────────
// Provider visual identity
// ────────────────────────────────────────────────────────────────────────────

/**
 * Per-provider accent palette (HSL pairs `from → to`).
 * Used for the provider row indicator and the model card ring on hover.
 * Saturation kept under 80% per design rules (no AI-purple, no neon).
 */
const PROVIDER_ACCENTS: Record<ProviderId, { from: string; to: string; hex: string }> = {
  anthropic: { from: '24 84% 60%', to: '14 84% 56%', hex: '#e07b3f' },
  deepseek: { from: '210 78% 56%', to: '226 70% 50%', hex: '#3a72d6' },
  minimax: { from: '270 60% 60%', to: '290 60% 55%', hex: '#9966c2' },
  moonshot: { from: '46 90% 56%', to: '32 88% 52%', hex: '#e6a836' },
  openrouter: { from: '160 60% 45%', to: '174 62% 42%', hex: '#2da38b' },
}

function ProviderInitial({ provider }: { provider: AnthropicCompatProvider }) {
  const accent = PROVIDER_ACCENTS[provider.id]
  const initials =
    provider.id === 'openrouter'
      ? 'OR'
      : provider.id === 'moonshot'
        ? 'K'
        : provider.id === 'minimax'
          ? 'MM'
          : provider.id === 'deepseek'
            ? 'DS'
            : 'A'
  return (
    <div
      className="grid h-7 w-7 place-items-center rounded-lg text-[11px] font-semibold tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
      style={{
        background: `linear-gradient(135deg, hsl(${accent.from}) 0%, hsl(${accent.to}) 100%)`,
      }}
    >
      {initials}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Capability badges
// ────────────────────────────────────────────────────────────────────────────

const CAP_META: Record<
  keyof NonNullable<ProviderModel['capabilities']>,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  thinking: { label: 'Thinking', icon: Brain, tone: 'bg-violet-500/12 text-violet-300 ring-violet-500/25' },
  multimodal: { label: 'Vision', icon: Eye, tone: 'bg-sky-500/12 text-sky-300 ring-sky-500/25' },
  coding: { label: 'Coding', icon: Code2, tone: 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/25' },
  toolUse: { label: 'Tools', icon: Wrench, tone: 'bg-amber-500/12 text-amber-300 ring-amber-500/25' },
  highSpeed: { label: 'Fast', icon: Zap, tone: 'bg-rose-500/12 text-rose-300 ring-rose-500/25' },
}

function CapabilityBadge({ cap }: { cap: keyof typeof CAP_META }) {
  const meta = CAP_META[cap]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
        meta.tone,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}

function modelCapBadges(model: ProviderModel) {
  const caps = model.capabilities ?? {}
  const out: React.ReactNode[] = []
  for (const k of Object.keys(CAP_META) as Array<keyof typeof CAP_META>) {
    if (caps[k]) out.push(<CapabilityBadge key={k} cap={k} />)
  }
  return out
}

function formatContext(tokens?: number) {
  if (!tokens) return null
  if (tokens >= 1_000_000) return `${tokens / 1_000_000}M ctx`
  if (tokens >= 1_000) return `${Math.round(tokens / 1000)}K ctx`
  return `${tokens} ctx`
}

// ────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ────────────────────────────────────────────────────────────────────────────

const KEY_PROVIDER = 'vibe_provider_id'
const KEY_MODEL = (id: ProviderId) => `vibe_model_${id}`
const KEY_EFFORT = 'vibe_effort_level'

function readPersisted(): { providerId: ProviderId; modelId: string; effort: EffortLevel } {
  if (typeof window === 'undefined') {
    return { providerId: 'anthropic', modelId: PROVIDERS.anthropic.defaultModel, effort: 'max' }
  }
  const stored = (localStorage.getItem(KEY_PROVIDER) as ProviderId | null) || 'anthropic'
  const provider = resolveProvider(stored)
  const modelId = localStorage.getItem(KEY_MODEL(provider.id)) || provider.defaultModel
  const effort = (localStorage.getItem(KEY_EFFORT) as EffortLevel | null) || (provider.effortLevel ?? 'max')
  return { providerId: provider.id, modelId, effort }
}

// ────────────────────────────────────────────────────────────────────────────
// Effort dial
// ────────────────────────────────────────────────────────────────────────────

const EFFORT_LEVELS: EffortLevel[] = ['min', 'low', 'medium', 'high', 'max']
const EFFORT_LABEL: Record<EffortLevel, string> = {
  min: 'Min', low: 'Low', medium: 'Med', high: 'High', max: 'Max',
}

function EffortDial({ value, onChange }: { value: EffortLevel; onChange: (v: EffortLevel) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Effort level"
      className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5 ring-1 ring-border/60 backdrop-blur-sm"
    >
      {EFFORT_LEVELS.map((lvl) => {
        const active = value === lvl
        return (
          <button
            key={lvl}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(lvl)}
            className={cn(
              'relative z-[1] rounded-md px-2 py-1 text-[11px] font-medium tracking-wide transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="effort-pill"
                className="absolute inset-0 -z-[1] rounded-md bg-background shadow-sm ring-1 ring-border/80"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            {EFFORT_LABEL[lvl]}
          </button>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────

export interface ProviderSelectorValue {
  providerId: ProviderId
  modelId: string
  effort: EffortLevel
}

export interface ProviderSelectorProps {
  value?: ProviderSelectorValue
  onChange?: (v: ProviderSelectorValue) => void
  /** Persist to localStorage. Default true. */
  persist?: boolean
  className?: string
  align?: 'start' | 'center' | 'end'
  /** Disable the trigger (e.g. while a generation is streaming). */
  disabled?: boolean
}

export function ProviderSelector({
  value,
  onChange,
  persist = true,
  className,
  align = 'start',
  disabled,
}: ProviderSelectorProps) {
  const reduceMotion = useReducedMotion()
  const isControlled = value !== undefined
  const [open, setOpen] = useState(false)

  const [internal, setInternal] = useState<ProviderSelectorValue>(() => readPersisted())
  // Hydrate from localStorage post-mount (avoids SSR/CSR mismatch).
  useEffect(() => {
    if (!isControlled) setInternal(readPersisted())
  }, [isControlled])

  const current: ProviderSelectorValue = isControlled ? value! : internal

  const provider = resolveProvider(current.providerId)
  const model = useMemo(
    () => provider.models.find((m) => m.id === current.modelId) ?? provider.models[0],
    [provider, current.modelId],
  )

  const update = useCallback(
    (next: Partial<ProviderSelectorValue>) => {
      const merged: ProviderSelectorValue = { ...current, ...next }
      // If provider changed and the model isn't valid in the new provider, snap to its default.
      if (next.providerId && next.providerId !== current.providerId) {
        const p = resolveProvider(next.providerId)
        if (!p.models.some((m) => m.id === merged.modelId)) merged.modelId = p.defaultModel
        merged.effort = p.effortLevel ?? merged.effort
      }
      if (!isControlled) setInternal(merged)
      if (persist && typeof window !== 'undefined') {
        localStorage.setItem(KEY_PROVIDER, merged.providerId)
        localStorage.setItem(KEY_MODEL(merged.providerId), merged.modelId)
        localStorage.setItem(KEY_EFFORT, merged.effort)
      }
      onChange?.(merged)
    },
    [current, isControlled, onChange, persist],
  )

  // Keyboard: Esc closes, Cmd/Ctrl+K opens.
  const triggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        triggerRef.current?.click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            // Provider/model chip: deliberately roomy. h-11 to read as a
            // primary control, px-5 py-3 for breathing room, min-w-[200px] so
            // the two-line provider/model stack never collides with the
            // chevron. Stronger glass + orange accent on open.
            'group relative h-11 min-w-[200px] gap-3 rounded-xl border border-border/70 bg-background/60 dark:bg-card/50 px-5 py-3 text-xs font-medium backdrop-blur-xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'hover:bg-background/85 hover:border-border hover:shadow-[0_6px_20px_-6px_rgba(249,115,22,0.18)]',
            'data-[state=open]:bg-background/90 data-[state=open]:border-orange-400/50 data-[state=open]:ring-2 data-[state=open]:ring-orange-400/20 data-[state=open]:shadow-[0_8px_24px_-8px_rgba(249,115,22,0.25)]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
            className,
          )}
        >
          <ProviderInitial provider={provider} />
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {provider.name}
            </span>
            <span className="text-xs font-semibold tracking-tight text-foreground/90 max-w-[160px] truncate">
              {model?.name ?? '—'}
            </span>
          </span>
          <span className="sm:hidden text-xs font-semibold">{provider.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={8}
        className={cn(
          'w-[680px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden',
          'rounded-2xl border border-border/60 bg-popover/85 backdrop-blur-2xl',
          'shadow-2xl shadow-black/40',
        )}
      >
        <div className="grid grid-cols-[210px_1fr]">
          {/* ──────────────── Provider rail ──────────────── */}
          <div className="border-r border-border/60 bg-muted/20 p-2">
            <div className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Provider
            </div>
            <div className="flex flex-col gap-0.5">
              {PROVIDER_LIST.map((p) => {
                const active = p.id === provider.id
                const accent = PROVIDER_ACCENTS[p.id]
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update({ providerId: p.id })}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                      active ? 'bg-background/80' : 'hover:bg-background/40',
                    )}
                  >
                    {active && !reduceMotion && (
                      <motion.span
                        layoutId="provider-active"
                        className="absolute inset-y-1 left-0 w-[3px] rounded-full"
                        style={{
                          background: `linear-gradient(180deg, hsl(${accent.from}), hsl(${accent.to}))`,
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <ProviderInitial provider={p} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold tracking-tight text-foreground truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {p.models.length} model{p.models.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    {active && <Check className="h-3.5 w-3.5 text-foreground/70" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ──────────────── Model + effort pane ──────────────── */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Model
                </span>
              </div>
              {provider.docsUrl && (
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Docs
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="flex flex-col gap-1.5 px-2 pb-2 max-h-[320px] overflow-y-auto">
              <AnimatePresence mode="popLayout" initial={false}>
                {provider.models.map((m, i) => {
                  const active = m.id === current.modelId
                  const ctx = formatContext(m.contextTokens)
                  return (
                    <motion.button
                      key={`${provider.id}::${m.id}`}
                      type="button"
                      layout={!reduceMotion}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ delay: reduceMotion ? 0 : i * 0.03, type: 'spring', stiffness: 280, damping: 26 }}
                      onClick={() => update({ modelId: m.id })}
                      className={cn(
                        'group/card relative flex flex-col gap-1.5 rounded-xl px-3 py-2.5 text-left transition-all',
                        'border border-transparent',
                        active
                          ? 'bg-background/85 border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                          : 'hover:bg-background/50 hover:border-border/40',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold tracking-tight text-foreground truncate">
                            {m.name}
                          </span>
                          {m.isDefault && (
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 px-1 py-0.5 rounded bg-muted/50">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {ctx && (
                            <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                              {ctx}
                            </span>
                          )}
                          {active && <Check className="h-3.5 w-3.5 text-foreground/80" />}
                        </div>
                      </div>
                      {m.description && (
                        <div className="text-[11px] text-muted-foreground/85 line-clamp-2 leading-snug">
                          {m.description}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">{modelCapBadges(m)}</div>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Effort row */}
            <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/15 px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-[11px] font-medium text-muted-foreground">Effort</span>
                <span className="text-[10px] text-muted-foreground/70 hidden md:inline">
                  controls reasoning depth
                </span>
              </div>
              <EffortDial
                value={current.effort}
                onChange={(e) => update({ effort: e })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/15 px-4 py-2 text-[10px] text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Routed via Claude Agent SDK · Anthropic-compat
          </div>
          <kbd className="rounded border border-border/70 bg-background/60 px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ProviderSelector
