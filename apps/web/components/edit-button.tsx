'use client'

import { Button } from '@/components/ui/button'
import { MousePointerClick } from 'lucide-react'
import type React from 'react'

interface EditButtonProps {
  isLoading: boolean
  sandboxId?: string | null
  isHoverModeEnabled: boolean
  onToggleHoverMode: (enabled: boolean) => void
}

export function EditButton({
  isLoading,
  sandboxId,
  isHoverModeEnabled,
  onToggleHoverMode,
}: EditButtonProps) {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    const newState = !isHoverModeEnabled
    onToggleHoverMode(newState)

    console.log(
      `[EditButton] Hover mode ${newState ? 'enabled' : 'disabled'} for sandbox:`,
      sandboxId,
    )

    // Trigger hover mode change via API
    if (sandboxId) {
      try {
        const response = await fetch('/api/hover-mode-toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sandboxId,
            enabled: newState,
          }),
        })

        if (!response.ok) {
          console.error('[EditButton] API response not OK:', response.status)
        } else {
          console.log(
            '[EditButton] API response OK, hover mode toggle sent successfully',
          )
        }
      } catch (error) {
        console.error('[EditButton] Failed to toggle hover mode:', error)
      }
    }
  }

  return (
    <Button
      type="button"
      disabled={isLoading || !sandboxId}
      variant={isHoverModeEnabled ? 'default' : 'outline'}
      size="sm"
      className={`hidden md:inline  rounded-xl gap-2 h-10 ${isHoverModeEnabled ? 'bg-red-500 hover:bg-red-600' : ''}`}
      onClick={handleClick}
      title={
        sandboxId
          ? isHoverModeEnabled
            ? 'Disable hover inspector'
            : 'Enable hover inspector'
          : 'Sandbox not ready'
      }
    >
      <div className='flex flex-row justify-center items-center space-x-2'>
      <MousePointerClick
        className={`h-5 w-5 ${isHoverModeEnabled ? 'text-white' : ''}`}
      />
      <span className={isHoverModeEnabled ? 'text-white ' : ''}>edit</span>
</div>
    </Button>
  )
}
