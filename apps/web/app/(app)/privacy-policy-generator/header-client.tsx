'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function PolicyGeneratorHeader({ isMobile = false }: { isMobile?: boolean }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && resolvedTheme === 'dark' ? '/flutter-vibe-code-long-logo-dark.svg' : '/flutter-vibe-code-long-logo.svg'

  if (isMobile) {
    return (
      <Link href="/" className="m-auto">
        <img
          src={logoSrc}
          alt="Capsule"
          className="h-7 w-auto"
          style={{ width: 220 }}
        />
      </Link>
    )
  }

  return (
    <Link href="/" className="flex items-center">
      <img
        src={logoSrc}
        alt="Capsule"
        className="h-7 w-auto"
        style={{ height: 100 }}
      />
    </Link>
  )
}
