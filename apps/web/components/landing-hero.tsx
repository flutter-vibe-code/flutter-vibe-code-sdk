'use client'

/**
 * Public marketing landing for Flutter Vibe Code.
 *
 * Shown when there is no session. Once the user signs in we render the
 * existing `<HomeClient>` chat input experience instead.
 */

import * as React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { AmbientBackground } from '@/components/ambient-background'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  Wand2,
  Rocket,
  Eye,
  Code2,
  History,
  ShieldCheck,
  Zap,
  Boxes,
  Globe,
  Github,
} from 'lucide-react'

// ────────────────────────────────────────────────────────────────────────────
// Brand atoms
// ────────────────────────────────────────────────────────────────────────────

function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors', className)}>
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      {withWordmark && <span>Flutter Vibe Code</span>}
    </Link>
  )
}

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', initials: 'A', from: '#f59e0b', to: '#d97706' },
  { id: 'deepseek', name: 'DeepSeek', initials: 'DS', from: '#3b82f6', to: '#1d4ed8' },
  { id: 'minimax', name: 'MiniMax', initials: 'MM', from: '#a855f7', to: '#9333ea' },
  { id: 'moonshot', name: 'Kimi', initials: 'K', from: '#eab308', to: '#ca8a04' },
  { id: 'openrouter', name: 'OpenRouter', initials: 'OR', from: '#10b981', to: '#0d9488' },
]

const STEPS = [
  {
    icon: MessageSquare,
    title: 'Describe your app',
    body: 'Type what you want in plain language. Attach screenshots, sketches or reference apps if it helps.',
  },
  {
    icon: Wand2,
    title: 'The agent builds it',
    body: 'Claude Agent SDK plans, writes Dart code, installs packages and iterates inside an isolated sandbox.',
  },
  {
    icon: Rocket,
    title: 'Preview & ship',
    body: 'Live web preview while you iterate. Build to iOS / Android / Web from one codebase, then ship.',
  },
]

const FEATURES = [
  {
    icon: Code2,
    title: 'Best-in-class coding agent',
    body: 'Claude Agent SDK runs the show. Tool use, planning, file edits, package install — all inside a fresh E2B sandbox.',
    accent: 'from-orange-500/14 to-amber-600/8 ring-orange-500/25',
  },
  {
    icon: Boxes,
    title: 'Bring your own provider',
    body: 'Route the SDK through any Anthropic-compatible endpoint. We support Anthropic, DeepSeek, MiniMax, Kimi and OpenRouter out of the box.',
    accent: 'from-emerald-500/14 to-teal-600/8 ring-emerald-500/25',
  },
  {
    icon: Eye,
    title: 'Live preview',
    body: 'Hot-reload Flutter Web in the browser as the agent writes code. See your app render in real-time.',
    accent: 'from-sky-500/14 to-blue-600/8 ring-sky-500/25',
  },
  {
    icon: History,
    title: 'History & rollback',
    body: 'Every change is committed automatically. Roll back to any previous version with one click.',
    accent: 'from-violet-500/14 to-fuchsia-600/8 ring-violet-500/25',
  },
  {
    icon: ShieldCheck,
    title: 'Instant error fixing',
    body: 'Runtime errors are captured and fed back to the agent. It diagnoses and patches without you copy-pasting stack traces.',
    accent: 'from-rose-500/14 to-pink-600/8 ring-rose-500/25',
  },
  {
    icon: Globe,
    title: 'Ship to web + stores',
    body: 'Deploy to the web with one click, or build signed App Store / Play Store bundles from the same Dart codebase.',
    accent: 'from-cyan-500/14 to-teal-600/8 ring-cyan-500/25',
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export interface LandingHeroProps {
  ctaHref?: string
}

export function LandingHero({ ctaHref = '/sign-up' }: LandingHeroProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <AmbientBackground variant="full" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://github.com/silviosotelo/flutter-vibe-code"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden sm:inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-card/40 px-3 text-xs font-medium text-foreground/80 backdrop-blur-md transition-colors hover:bg-card/70"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <Link href="/sign-in" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium">
              Sign in
            </Button>
          </Link>
          <Link href={ctaHref}>
            <Button
              size="sm"
              className="h-9 px-4 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              Start building
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto w-full max-w-[1280px] px-5 pt-12 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-36">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:items-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/30 px-3 py-1.5 text-[11px] font-medium tracking-wide text-foreground/80 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-orange-500" />
              Powered by Claude Agent SDK
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tighter leading-[1.02] text-foreground">
              Build cross-platform
              <br />
              <span className="bg-gradient-to-br from-orange-500 to-amber-600 bg-clip-text text-transparent">
                Flutter apps
              </span>
              <br />
              from a single prompt.
            </h1>
            <p className="max-w-[56ch] text-base sm:text-lg leading-relaxed text-muted-foreground">
              Describe what you want in plain English. The agent plans, writes idiomatic Dart, installs packages and iterates with hot reload. iOS, Android and Web from one codebase — no setup required.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={ctaHref}>
                <Button size="lg" className="h-12 rounded-xl px-6 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  Start building free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="h-12 rounded-xl border-border/70 bg-card/40 px-6 text-sm font-medium backdrop-blur-md">
                  I have an account
                </Button>
              </Link>
            </div>
            <ProviderRail />
          </motion.div>

          {/* Visual: stylised chat → preview mock */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative"
          >
            <HeroMock />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 border-t border-border/60 bg-card/15">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-10 max-w-[42ch] space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">How it works</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Three steps from idea to running app. The agent does the boilerplate.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Step key={s.title} index={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 border-t border-border/60">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[44ch] space-y-3">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Everything you need to ship
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                We handle the agent loop, the sandbox, the preview and the deployment. You stay in the prompt.
              </p>
            </div>
            <Link href={ctaHref} className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Try it free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 border-t border-border/60 bg-gradient-to-br from-card/30 via-background to-background">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24 text-center">
          <h2 className="mx-auto max-w-[24ch] text-3xl sm:text-5xl font-semibold tracking-tighter leading-tight text-foreground">
            Ship your first Flutter app today.
          </h2>
          <p className="mx-auto mt-4 max-w-[56ch] text-base sm:text-lg leading-relaxed text-muted-foreground">
            Free to try. Bring your own keys. Cancel anytime.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={ctaHref}>
              <Button size="lg" className="h-12 rounded-xl px-6 text-sm font-semibold">
                Start building free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="h-12 rounded-xl border-border/70 bg-card/40 px-6 text-sm font-medium backdrop-blur-md">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Logo withWordmark={false} />
            <span>© {new Date().getFullYear()} Flutter Vibe Code</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

// AmbientBackground now lives in `@/components/ambient-background` and is imported above.

function ProviderRail() {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-3">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">Routes through</span>
      <div className="flex items-center gap-2">
        {PROVIDERS.map((p) => (
          <div
            key={p.id}
            title={p.name}
            className="grid h-7 w-7 place-items-center rounded-lg text-[10px] font-semibold tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
            style={{ background: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)` }}
          >
            {p.initials}
          </div>
        ))}
      </div>
    </div>
  )
}

function Step({ index, icon: Icon, title, body }: { index: number; icon: any; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border border-border/60 bg-card/30 p-5 backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 ring-1 ring-inset ring-border/80">
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-mono text-xs text-muted-foreground/60">0{index + 1}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </motion.div>
  )
}

function FeatureCard({ icon: Icon, title, body, accent }: { icon: any; title: string; body: string; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-md transition-all',
        'hover:border-border hover:bg-card/60',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          accent,
        )}
      />
      <div className="relative">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 ring-1 ring-inset ring-border/80">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </motion.div>
  )
}

/** Stylised chat → preview mock for the hero right column. */
function HeroMock() {
  return (
    <div className="relative">
      {/* Glow */}
      <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-orange-500/12 via-amber-500/8 to-emerald-500/8 blur-2xl" />
      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-2xl shadow-2xl shadow-black/40">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border/60 bg-card/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/60">flutter run -d web-server</span>
          <Sparkles className="h-3 w-3 text-orange-500" />
        </div>
        {/* Body grid */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr]">
          {/* Chat side */}
          <div className="border-b sm:border-b-0 sm:border-r border-border/60 p-4 space-y-3 bg-card/30">
            <ChatBubble role="user">Build me a Pomodoro timer with sessions history.</ChatBubble>
            <ChatBubble role="assistant">
              Creating <span className="font-mono">lib/screens/timer_screen.dart</span> · <span className="font-mono">timer_provider.dart</span>…
            </ChatBubble>
            <ChatBubble role="assistant">
              Done. <span className="text-emerald-500">flutter pub get</span> · <span className="text-emerald-500">dart analyze</span> · running on <span className="font-mono">:3000</span>.
            </ChatBubble>
          </div>
          {/* Preview side */}
          <div className="grid place-items-center p-4 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent">
            <div className="w-full max-w-[180px] rounded-2xl border border-border/60 bg-background/80 p-4 shadow-lg">
              <div className="text-center space-y-2">
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Focus</div>
                <div className="text-3xl font-semibold tabular-nums tracking-tight">24:53</div>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  <span className="h-1.5 rounded-full bg-orange-500" />
                  <span className="h-1.5 rounded-full bg-orange-500/40" />
                  <span className="h-1.5 rounded-full bg-orange-500/20" />
                </div>
                <button className="mt-3 w-full rounded-lg bg-foreground px-3 py-1.5 text-[10px] font-medium text-background">
                  Start session
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-card/30 px-4 py-2 text-[10px] text-muted-foreground/80">
          <span>Live preview</span>
          <span className="inline-flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            ready
          </span>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[90%] rounded-xl px-3 py-2 text-[12px] leading-relaxed',
          isUser
            ? 'bg-foreground text-background'
            : 'bg-background/70 text-foreground border border-border/60 backdrop-blur-md',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default LandingHero
