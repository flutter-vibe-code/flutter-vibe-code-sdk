'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Session } from '@/lib/auth'
import { Crown } from 'lucide-react'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { SubscriptionModal } from './subscription-modal'

interface SubscriptionNavButtonProps {
  session: Session | null
}

export const SubscriptionNavButton = React.memo(function SubscriptionNavButton({ session }: SubscriptionNavButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [isLoadingLocal, setIsLoadingLocal] = useState(true)
  const fetchedRef = useRef(false)

  const fetchSubscriptionStatus = useCallback(async () => {
    // Only fetch once per session
    if (fetchedRef.current) return
    fetchedRef.current = true

    setIsLoadingLocal(true)
    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
    } finally {
      setIsLoadingLocal(false)
    }
  }, [])

  // Defer subscription check to avoid blocking initial render
  useEffect(() => {
    if (!session) {
      setIsLoadingLocal(false)
      return
    }

    // Defer the API call to not block the initial render
    const timeoutId = setTimeout(() => {
      if (!fetchedRef.current) {
        fetchSubscriptionStatus()
      }
    }, 100) // Small delay to let the UI render first

    return () => clearTimeout(timeoutId)
  }, [session, fetchSubscriptionStatus])

  const handleUpgradeClick = () => {
    setIsModalOpen(true)
  }

  // Don't show button if:
  // 1. No session
  // 2. Still loading subscription status
  // 3. User already has an active subscription
  if (!session || isLoadingLocal) {
    return null
  }

  // Only show upgrade button if user doesn't have an active subscription
  if (subscriptionStatus?.hasSubscription && subscriptionStatus?.status === 'active') {
    return null
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={handleUpgradeClick}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Crown className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Upgrade to Pro</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upgrade to Pro</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SubscriptionModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </>
  )
})
