'use client'

/**
 * /sign-in — premium auth page.
 *
 * Two-column split: left rail with brand + value props, right pane with form.
 * Email/password (Better Auth `authClient.signIn.email`) + Google OAuth.
 */

import { useState, Suspense } from 'react'
import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { authClient, signInWithGoogle } from '@flutter-vibe-code/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Sparkles, Loader2, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

const VALUE_PROPS = [
  'Generate Flutter apps from natural language',
  'Iterate with hot reload in a sandboxed E2B preview',
  'Bring your own keys: Anthropic · DeepSeek · MiniMax · Kimi · OpenRouter',
  'Ship to web, App Store and Play Store from one codebase',
]

function SignInPageInner() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search?.get('next') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [loading, setLoading] = useState<'email' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading('email')
    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: next,
      })
      if ((res as any)?.error) {
        setError((res as any).error?.message || 'Sign-in failed')
      } else {
        router.push(next)
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error')
    } finally {
      setLoading(null)
    }
  }

  const onGoogle = async () => {
    setLoading('google')
    try {
      await signInWithGoogle(next)
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed')
      setLoading(null)
    }
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* ──────── Left rail: brand + value props ──────── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border/60 bg-gradient-to-br from-card/40 via-background to-background p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-orange-500/15 via-amber-500/8 to-transparent blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 right-[-10%] h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-emerald-500/12 via-teal-500/6 to-transparent blur-3xl"
        />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Flutter Vibe Code
          </Link>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-5xl font-semibold tracking-tighter leading-[1.05] text-foreground"
            >
              Build cross-platform Flutter apps
              <br />
              <span className="text-muted-foreground">from a single prompt.</span>
            </motion.h1>
            <p className="max-w-[48ch] text-base leading-relaxed text-muted-foreground">
              The agent runs Claude Agent SDK routed through any Anthropic-compatible provider. You ship Dart, you keep the keys.
            </p>
          </div>

          <ul className="space-y-3 max-w-[42ch]">
            {VALUE_PROPS.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                className="flex items-start gap-2.5 text-sm text-foreground/85"
              >
                <span className="mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                </span>
                {p}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-muted-foreground/70">
          Powered by Claude Agent SDK · routed via Anthropic-compat
        </div>
      </div>

      {/* ──────── Right pane: form ──────── */}
      <div className="flex flex-col items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-[400px]">
          <Link
            href="/"
            className="lg:hidden mb-8 inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            Flutter Vibe Code
          </Link>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to keep building.{' '}
              <Link
                href={`/sign-up${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Need an account?
              </Link>
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading !== null}
            onClick={onGoogle}
            className="h-11 w-full justify-center gap-2.5 rounded-xl border-border/80 bg-card/40 text-sm font-medium backdrop-blur-md hover:bg-card/70 transition-all"
          >
            {loading === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleMark />
            )}
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            <div className="h-px flex-1 bg-border/60" />
            or
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="h-11 rounded-xl bg-background/60"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="h-11 rounded-xl bg-background/60 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={reveal ? 'Hide password' : 'Reveal password'}
                >
                  {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-[12px] text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading !== null}
              className={cn(
                'group h-11 w-full justify-center gap-2 rounded-xl text-sm font-medium',
                'bg-foreground text-background hover:bg-foreground/90',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
              )}
            >
              {loading === 'email' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-[11px] text-muted-foreground/70 leading-relaxed">
            By continuing you agree to the{' '}
            <Link href="/terms-of-service" className="underline-offset-4 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/policy" className="underline-offset-4 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.32A9 9 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.97H.95a9 9 0 0 0 0 8.06l3.02-2.32z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .95 4.97L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] grid place-items-center text-sm text-muted-foreground">Loading…</div>}>
      <SignInPageInner />
    </Suspense>
  )
}
