'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@flutter-vibe-code/ui'
import { Button, Badge, cn } from '@flutter-vibe-code/ui'
import { Check, Crown, Loader2, Settings, X } from 'lucide-react'
import { PLANS } from '../lib/config'
import type { Plan, SubscriptionStatus } from '../types'

export interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  getSubscriptionStatus: () => Promise<SubscriptionStatus>
  priceIds?: {
    start?: string
    pro?: string
    senior?: string
  }
  toast?: (options: { title: string; description: string; variant?: 'destructive' }) => void
}

export function SubscriptionModal({
  open,
  onOpenChange,
  getSubscriptionStatus,
  priceIds = {},
  toast,
}: SubscriptionModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  const plansWithIds: Plan[] = PLANS.map(plan => ({
    ...plan,
    productId: priceIds[plan.slug as keyof typeof priceIds],
  }))

  useEffect(() => {
    if (open) {
      setIsLoadingStatus(true)
      getSubscriptionStatus()
        .then(setSubscriptionStatus)
        .catch((error) => console.error('[Subscription Modal]', error))
        .finally(() => setIsLoadingStatus(false))
    }
  }, [open, getSubscriptionStatus])

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.productId) {
      toast?.({ title: 'Configuration Error', description: `Price ID for ${plan.name} not configured.`, variant: 'destructive' })
      return
    }
    setLoadingPlan(plan.name)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.productId, planName: plan.name }),
      })
      if (!response.ok) throw new Error('Checkout failed')
      const { checkoutUrl } = await response.json()
      if (checkoutUrl) window.location.href = checkoutUrl
    } catch (error) {
      toast?.({ title: 'Subscription Error', description: 'Failed to start checkout.', variant: 'destructive' })
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!subscriptionStatus?.customerId) {
      toast?.({ title: 'Error', description: 'No customer ID found.', variant: 'destructive' })
      return
    }
    setLoadingPlan('manage')
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscriptionStatus.customerId }),
      })
      if (!response.ok) throw new Error('Portal failed')
      const { portalUrl } = await response.json()
      if (portalUrl) window.location.href = portalUrl
    } catch (error) {
      toast?.({ title: 'Portal Error', description: 'Failed to open portal.', variant: 'destructive' })
    } finally {
      setLoadingPlan(null)
    }
  }

  if (isLoadingStatus) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (subscriptionStatus?.hasSubscription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Subscription Details</DialogTitle>
              <DialogDescription className="text-center mt-2">
                You are on the <Badge variant="outline" className="capitalize">{subscriptionStatus.currentPlan}</Badge> plan
              </DialogDescription>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 opacity-70" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between mb-2"><span className="text-sm text-muted-foreground">Plan</span><span className="font-semibold capitalize">{subscriptionStatus.currentPlan}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Messages</span><span className="font-semibold">{subscriptionStatus.messagesUsed} / {subscriptionStatus.messageLimit}</span></div>
              </div>
              <Button className="w-full" onClick={handleManageSubscription} disabled={loadingPlan === 'manage'}>
                {loadingPlan === 'manage' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opening...</> : <><Settings className="h-4 w-4 mr-2" />Manage</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
            <div className="text-center mt-2 bg-muted border rounded-lg px-4 py-3 text-sm">
              We have halved plan prices! React Native Vibe Code is now the most affordable vibe coding platform.
            </div>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 opacity-70" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansWithIds.map((plan) => (
              <div key={plan.name} className={cn('relative rounded-lg border p-6 transition-all hover:shadow-lg', plan.popular ? 'border-primary shadow-md scale-105' : 'border-border')}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">POPULAR</span></div>}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline"><span className="text-3xl font-bold">${plan.price}</span><span className="text-muted-foreground ml-1">/{plan.period}</span></div>
                    <span className="text-2xl text-muted-foreground line-through">${plan.originalPrice}/{plan.period}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start"><Check className="h-4 w-4 text-primary mt-0.5 mr-2 flex-shrink-0" /><span className="text-sm">{feature}</span></li>
                    ))}
                  </ul>
                  <Button className={cn('w-full', plan.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : '')} variant={plan.popular ? 'default' : 'outline'} onClick={() => handleSubscribe(plan)} disabled={loadingPlan !== null}>
                    {loadingPlan === plan.name ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : <><Crown className="h-4 w-4 mr-2" />{plan.name === 'Start' ? 'Get Started' : `Upgrade to ${plan.name}`}</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">Messages reset each month on the 1st.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
