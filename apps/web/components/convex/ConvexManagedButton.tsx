'use client'

// Convex Managed Button Component
// Creates a platform-managed Convex backend (no user account needed)

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ConvexManagedButtonProps {
  projectId: string
  onSuccess?: () => void
  disabled?: boolean
}

export function ConvexManagedButton({ projectId, onSuccess, disabled }: ConvexManagedButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateManaged = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/convex/managed/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        onSuccess?.()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create managed backend')
      }
    } catch (err) {
      console.error('Error creating managed Convex:', err)
      setError('Failed to create managed backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleCreateManaged}
        disabled={disabled || loading}
        className="w-full"
      >
        {loading ? 'Creating Backend...' : 'Create Managed Backend'}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
