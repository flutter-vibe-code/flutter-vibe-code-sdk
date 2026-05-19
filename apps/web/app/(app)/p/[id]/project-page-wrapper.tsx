'use client'

import dynamic from 'next/dynamic'
import Loading from './loading'
import { IntercomWidget } from '@/components/intercom-widget'
import { AmbientBackground } from '@/components/ambient-background'

const ProjectPage = dynamic(
  () => import('./project-page').then((mod) => mod.ProjectPageInternal),
  { ssr: false, loading: () => <Loading /> },
)

export function ProjectPageWrapper({
  opencodeEnabled,
  template,
}: {
  opencodeEnabled: boolean
  template: 'flutter' | 'flutter'
}) {
  return (
    <div className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-orange-50/30 via-background to-emerald-50/20 dark:from-orange-950/15 dark:via-background dark:to-emerald-950/10">
      {/* Ambient background — subtle variant for the IDE chrome. */}
      <AmbientBackground variant="subtle" />

      {/* Top + bottom brand accent rails. Larger glow than before — they
          actually hint at the gradient mesh behind the panels. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[2px] bg-gradient-to-r from-transparent via-orange-500/80 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />

      {/* Top-left brand glow — bumped opacity so the IDE feels alive, not flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 z-[3] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.48),rgba(245,158,11,0.18)_45%,transparent_75%)] blur-3xl"
      />
      {/* Bottom-right teal counterweight. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-40 z-[3] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.32),rgba(56,189,248,0.16)_45%,transparent_75%)] blur-3xl"
      />
      {/* Mid sky pop — breaks the symmetry, gives depth on wide viewports. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[42%] left-[55%] z-[3] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.20),rgba(217,70,239,0.10)_45%,transparent_72%)] blur-3xl"
      />

      {/* Subtle grid texture so the surface is never empty white. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[4] opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative z-10 h-[100dvh]">
        <IntercomWidget />
        <ProjectPage opencodeEnabled={opencodeEnabled} template={template} />
      </div>
    </div>
  )
}
