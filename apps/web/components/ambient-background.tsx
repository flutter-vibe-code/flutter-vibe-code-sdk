'use client'

/**
 * Reusable ambient background — two variants:
 *   - "full"   used on the public landing: 4 perpetual-motion orbs, grid+dot,
 *              light beams, SVG noise grain.
 *   - "subtle" used inside the IDE shell: 2 orbs at lower opacity, dot field
 *              only, no light beams (so chrome and chat panels stay readable).
 */

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export interface AmbientBackgroundProps {
  variant?: 'full' | 'subtle'
  className?: string
}

export const AmbientBackground = React.memo(function AmbientBackground({
  variant = 'full',
  className,
}: AmbientBackgroundProps) {
  const reduceMotion = useReducedMotion() ?? false
  const subtle = variant === 'subtle'

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
    >
      {/* Grid pattern */}
      {!subtle && (
        <div
          className="absolute inset-0 opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      )}

      {/* Dot field — even subtle keeps a hint of texture */}
      <div
        className={`absolute inset-0 ${subtle ? 'opacity-[0.06]' : 'opacity-[0.05]'} [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]`}
        style={{
          backgroundImage:
            'radial-gradient(circle at center, currentColor 1px, transparent 1px)',
          backgroundSize: subtle ? '28px 28px' : '20px 20px',
        }}
      />

      {/* Orbs */}
      <Orb
        position="absolute -top-40 -left-40 h-[680px] w-[680px]"
        gradient="bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.32),rgba(245,158,11,0.18)_40%,transparent_70%)]"
        opacityClass={subtle ? 'opacity-90' : ''}
        drift={{ x: [0, 40, -20, 0], y: [0, -30, 15, 0], scale: [1, 1.06, 0.98, 1], dur: { x: 28, y: 22, scale: 18 } }}
        delay={0}
        reduceMotion={reduceMotion}
      />
      {!subtle && (
        <Orb
          position="absolute top-[18%] -right-44 h-[560px] w-[560px]"
          gradient="bg-[radial-gradient(circle_at_60%_40%,rgba(16,185,129,0.28),rgba(20,184,166,0.14)_45%,transparent_72%)]"
          drift={{ x: [0, -50, 20, 0], y: [0, 40, -10, 0], scale: [1, 0.94, 1.05, 1], dur: { x: 26, y: 30, scale: 20 } }}
          delay={0.15}
          reduceMotion={reduceMotion}
        />
      )}
      <Orb
        position={
          subtle
            ? 'absolute -bottom-40 -right-32 h-[420px] w-[420px]'
            : 'absolute bottom-[-200px] left-[28%] h-[520px] w-[520px]'
        }
        gradient={
          subtle
            ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.36),rgba(56,189,248,0.20)_45%,transparent_72%)]'
            : 'bg-[radial-gradient(circle_at_50%_60%,rgba(56,189,248,0.24),rgba(99,102,241,0.14)_45%,transparent_72%)]'
        }
        opacityClass={subtle ? 'opacity-95' : ''}
        drift={{ x: [0, 30, -25, 0], y: [0, -20, 25, 0], scale: [1, 1.04, 0.96, 1], dur: { x: 32, y: 24, scale: 22 } }}
        delay={0.3}
        reduceMotion={reduceMotion}
      />
      {!subtle && (
        <Orb
          position="absolute top-[55%] left-[42%] h-[340px] w-[340px]"
          gradient="bg-[radial-gradient(circle_at_40%_50%,rgba(168,85,247,0.18),rgba(217,70,239,0.10)_45%,transparent_70%)]"
          drift={{ x: [0, -40, 30, 0], y: [0, 25, -35, 0], dur: { x: 34, y: 28 } }}
          delay={0.45}
          reduceMotion={reduceMotion}
        />
      )}

      {/* Light beams — full variant only */}
      {!subtle && (
        <div className="absolute inset-x-0 top-0 h-[120vh] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]">
          <div className="absolute left-[8%] top-0 h-full w-px rotate-[14deg] origin-top bg-gradient-to-b from-orange-500/20 via-orange-500/4 to-transparent" />
          <div className="absolute right-[18%] top-0 h-full w-px -rotate-[10deg] origin-top bg-gradient-to-b from-emerald-500/16 via-emerald-500/4 to-transparent" />
        </div>
      )}

      {/* Noise grain */}
      <svg
        className={`absolute inset-0 h-full w-full ${subtle ? 'opacity-[0.045]' : 'opacity-[0.045]'} mix-blend-overlay`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id={subtle ? 'fvc-noise-subtle' : 'fvc-noise'}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${subtle ? 'fvc-noise-subtle' : 'fvc-noise'})`} />
      </svg>
    </div>
  )
})

function Orb({
  position,
  gradient,
  opacityClass,
  drift,
  delay,
  reduceMotion,
}: {
  position: string
  gradient: string
  opacityClass?: string
  drift: { x?: number[]; y?: number[]; scale?: number[]; dur: { x?: number; y?: number; scale?: number } }
  delay: number
  reduceMotion: boolean
}) {
  const animate: any = { opacity: 1 }
  const transition: any = { opacity: { duration: 1.2, delay } }
  if (!reduceMotion) {
    if (drift.x) {
      animate.x = drift.x
      transition.x = { duration: drift.dur.x ?? 26, repeat: Infinity, ease: 'easeInOut' }
    }
    if (drift.y) {
      animate.y = drift.y
      transition.y = { duration: drift.dur.y ?? 28, repeat: Infinity, ease: 'easeInOut' }
    }
    if (drift.scale) {
      animate.scale = drift.scale
      transition.scale = { duration: drift.dur.scale ?? 20, repeat: Infinity, ease: 'easeInOut' }
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={animate}
      transition={transition}
      className={`${position} ${opacityClass ?? ''} rounded-full ${gradient} blur-3xl`}
    />
  )
}

export default AmbientBackground
