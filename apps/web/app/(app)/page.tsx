import { getServerSession } from '@/lib/auth/index'
import { HomeClient } from '@/components/home-client'
import { LandingHero } from '@/components/landing-hero'
import { opencodeEnabled } from '@/flags'

/**
 * `/` entry. Branches on session:
 *  - logged out → public marketing landing (LandingHero — owns its own ambient)
 *  - logged in  → existing chat-input experience.
 *
 * The ambient background is now owned by `app/(app)/layout.tsx`, so we don't
 * stack a second one here and we don't paint `bg-background` over it.
 */
export default async function Home() {
  const session = await getServerSession()

  if (!session) {
    return <LandingHero ctaHref="/sign-up" />
  }

  const showOpencode = await opencodeEnabled()
  return (
    <main className="relative flex flex-col min-h-dvh">
      <div className="md:h-dvh flex">
        <HomeClient initialSession={session} opencodeEnabled={!!showOpencode} />
      </div>
    </main>
  )
}
