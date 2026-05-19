'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Project page error:', error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  )
}