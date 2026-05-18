import Link from 'next/link'
import { FileText } from 'lucide-react'
import { PolicyGeneratorHeader } from './header-client'

export default function PolicyGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="md:hidden border-b border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex w-full items-center justify-center h-12">
          <PolicyGeneratorHeader isMobile />
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-4"></div>
          <Link
            href="/privacy-policy-generator"
            className="-left-[60px] relative flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <span className="font-semibold">Privacy Policy Generator</span>
          </Link>
        </div>
      </header>

      {/* Desktop header */}
      <header className="hidden md:block border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PolicyGeneratorHeader />
          </div>
          <Link
            href="/privacy-policy-generator"
            className="-left-[60px] relative flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <span className="font-semibold">Privacy Policy Generator</span>
          </Link>
          <Link
            href="/"
            className="hidden md:relative text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Capsule
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Minimal footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center text-sm text-muted-foreground">
          <p>Privacy Policy Generator by Capsule</p>
          <p className="mt-1">Updated for Apple App Store requirements (December 2025)</p>
        </div>
      </footer>
    </div>
  )
}
