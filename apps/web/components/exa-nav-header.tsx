'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ExaNavHeader() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="w-full flex bg-background py-4 px-4 md:px-8 border-b">
      <div className="flex flex-1 justify-between max-w-4xl margin-0" style={{margin: '0 auto'}}>
        <Link href="/" className="flex items-center gap-2">
          <img
            src={mounted && resolvedTheme === 'dark' ? '/logo_small_dark.svg' : '/logo_small.svg'}
            alt="Logo"
            className="w-[120px] h-[29px] sm:w-[240px] sm:h-[58px]"
            style={{width: 180}}
          />
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/exa-logo-light.avif"
            alt="Exa Logo"
            style={{width: 80}}
          />
        </Link>
      </div>
      <div className="flex items-center gap-1 md:gap-4">
        {/* Right side content - empty for now */}
      </div>
    </nav>
  )
}
