// import 'react-scan'
import './globals.css'
import { PostHogProvider, ThemeProvider } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ExtensionCleanup } from '@/components/extension-cleanup'
import { AmbientBackground } from '@/components/ambient-background'
// import { ReactScan } from '@/components/react-scan'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flutter Vibe Code',
  description: 'vibe code mobile apps',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PostHogProvider>
        <body suppressHydrationWarning className={inter.className}>
          <ExtensionCleanup />
          {/* <ReactScan /> */}
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative isolate min-h-[100dvh] overflow-hidden bg-[radial-gradient(ellipse_at_top,#fff7ed_0%,#faf5f0_25%,#f1f5f9_60%,#e2e8f0_100%)] dark:bg-[radial-gradient(ellipse_at_top,#1c1917_0%,#0f0f10_45%,#08080a_100%)]">
              <AmbientBackground variant="subtle" />
              <div className="relative z-10">{children}</div>
            </div>
          </ThemeProvider>
          <Toaster />
          <SonnerToaster />
        </body>
      </PostHogProvider>
    </html>
  )
}
