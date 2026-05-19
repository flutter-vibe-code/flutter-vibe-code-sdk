'use client'

import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@flutter-vibe-code/ui'
import { Button, Card, CardContent, CardHeader, cn } from '@flutter-vibe-code/ui'
import { AlertTriangle, Crown } from 'lucide-react'
import { SubscriptionModal, type SubscriptionModalProps } from './subscription-modal'
import type { RateLimitInfo, SubscriptionStatus } from '../types'

export interface RateLimitCardProps extends RateLimitInfo {
  className?: string
  getSubscriptionStatus: () => Promise<SubscriptionStatus>
  priceIds?: SubscriptionModalProps['priceIds']
  toast?: SubscriptionModalProps['toast']
}

export function RateLimitCard({
  reason,
  usageCount,
  messageLimit,
  className,
  getSubscriptionStatus,
  priceIds,
  toast,
}: RateLimitCardProps) {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)

  return (
    <>
      <Card className={cn('border-red-500/50 bg-red-50/50 dark:bg-red-950/20 mx-auto', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <AlertTitle className="text-red-800 dark:text-red-200 text-base font-semibold">
                Message Limit Reached
              </AlertTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-w-full">
          <Alert variant="destructive" className="border-red-400/50 bg-red-100/50 dark:bg-red-900/30">
            <AlertDescription className="text-red-700 dark:text-red-300">
              {reason}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="hidden rounded-lg bg-red-50 dark:bg-red-950/30 p-3 border border-red-200/50 dark:border-red-800/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-700 dark:text-red-300 font-medium">Current usage:</span>
                <span className="text-red-800 dark:text-red-200 font-semibold">
                  {usageCount} / {messageLimit} messages
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-red-200/50 dark:bg-red-900/50 rounded-full h-2">
                  <div
                    className="bg-red-500 dark:bg-red-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((usageCount / messageLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SubscriptionModal
        open={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
        getSubscriptionStatus={getSubscriptionStatus}
        priceIds={priceIds}
        toast={toast}
      />
    </>
  )
}
