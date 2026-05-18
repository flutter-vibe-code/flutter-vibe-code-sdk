'use client'

// Convex Connect Button Component
// Initiates OAuth flow to connect a project to Convex

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link2 } from 'lucide-react'

interface ConvexConnectButtonProps {
  projectId: string
  teamSlug?: string
  disabled?: boolean
  onSuccess?: () => void
}

export function ConvexConnectButton({
  projectId,
  teamSlug,
  disabled,
  onSuccess,
}: ConvexConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    if (!teamSlug) {
      alert('Please select a Convex team first')
      return
    }

    setLoading(true)

    // Redirect to OAuth flow in same window
    // The callback will redirect back to the project page
    window.location.href = `/convex/connect?state=${projectId}`
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={disabled || loading || !teamSlug}
      variant="default"
      size="sm"
    >
      {loading ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Connecting...
        </>
      ) : (
        <>
          <Link2 className="mr-2 h-4 w-4" />
          Connect to Convex
        </>
      )}
    </Button>
  )
}
