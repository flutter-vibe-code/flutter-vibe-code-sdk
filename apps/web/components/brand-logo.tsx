'use client'

/**
 * Reusable brand logo: gradient cap + Sparkles + optional wordmark.
 * Replaces every `<img src="/logo_*.svg">` ref across the app so the IDE
 * never depends on the heavy 166KB SVG file the user vetoed.
 */

import * as React from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BrandLogoProps {
  /** Show the "Flutter Vibe Code" text next to the cap. */
  withWordmark?: boolean
  /** When provided, wraps the logo in a Link to that href. */
  href?: string
  /** Cap size in tailwind shorthand. Default `h-8 w-8`. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** When true, render only the cap (no link, no wordmark). */
  iconOnly?: boolean
}

const SIZES = {
  sm: { cap: 'h-6 w-6', icon: 'h-3 w-3', text: 'text-xs' },
  md: { cap: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-sm' },
  lg: { cap: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-base' },
} as const

export function BrandCap({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = SIZES[size]
  return (
    <div
      className={cn(
        'grid place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
        s.cap,
        className,
      )}
    >
      <Sparkles className={cn('text-white', s.icon)} />
    </div>
  )
}

export function BrandLogo({
  withWordmark = true,
  href,
  size = 'md',
  className,
  iconOnly,
}: BrandLogoProps) {
  const s = SIZES[size]
  const cap = <BrandCap size={size} />
  if (iconOnly) return cap

  const inner = (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight text-foreground', s.text, className)}>
      {cap}
      {withWordmark && <span>Flutter Vibe Code</span>}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="hover:text-foreground/80 transition-colors">
        {inner}
      </Link>
    )
  }
  return inner
}

export default BrandLogo
