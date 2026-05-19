'use client'

/**
 * Client-side utilities for Polar payments
 * Import from '@flutter-vibe-code/payments/client'
 */

import { useState, useEffect, useCallback } from 'react'
import type { SubscriptionStatus } from '../types'

export interface PolarClientOptions {
  /** Auth client with checkout and customer methods */
  authClient?: {
    checkout?: (options: { slug: string; products: string[] }) => Promise<void>
    customer?: {
      state?: () => Promise<{ data?: { activeMeters?: any[]; activeSubscriptions?: any[] } }>
      portal?: () => Promise<void>
    }
  }
  /** Session data with user info */
  session?: { user?: { id?: string } } | null
}

/**
 * Client-side Polar utilities
 * These require the auth client to be passed in since the package doesn't know about auth configuration
 */
export function createPolarUtils(options: PolarClientOptions = {}) {
  const { authClient } = options

  return {
    /**
     * Start Pro subscription checkout using Better Auth Polar integration
     */
    async startProCheckout(productId: string) {
      try {
        if (!authClient?.checkout) {
          throw new Error('Auth client checkout method not available')
        }
        await authClient.checkout({
          slug: 'pro',
          products: [productId],
        })
      } catch (error) {
        console.error('[Payments] Failed to start checkout:', error)
        throw error
      }
    },

    /**
     * Get subscription status using Better Auth Polar integration
     */
    async getSubscriptionStatus(): Promise<{ isSubscribed: boolean }> {
      try {
        // Check if authClient.customer exists before calling methods
        if (!authClient?.customer?.state) {
          console.warn('[Payments] Better Auth customer methods not available, using fallback')
          // Try fallback immediately if customer methods don't exist
          const response = await fetch('/api/subscription/status')
          if (response.ok) {
            const data = await response.json()
            return data
          }
          return { isSubscribed: false }
        }

        // Try Better Auth's polar customer state method first
        const customerState = await authClient.customer.state()

        // Check for active subscriptions more thoroughly
        const activeSubscriptions =
          (customerState?.data?.activeMeters?.length ?? 0) > 0 ||
          (customerState?.data?.activeSubscriptions?.length ?? 0) > 0

        return { isSubscribed: activeSubscriptions }
      } catch (error) {
        console.error(
          '[Payments] Failed to get subscription status via Better Auth, trying fallback API:',
          error,
        )

        // Fallback to the original API endpoint
        try {
          const response = await fetch('/api/subscription/status')
          if (response.ok) {
            const data = await response.json()
            return data
          }
          return { isSubscribed: false }
        } catch (fallbackError) {
          console.error('[Payments] Fallback API also failed:', fallbackError)
          return { isSubscribed: false }
        }
      }
    },

    /**
     * Open customer portal
     */
    async openCustomerPortal() {
      try {
        if (!authClient?.customer?.portal) {
          console.warn('[Payments] Better Auth customer portal not available')
          throw new Error('Customer portal not available')
        }
        await authClient.customer.portal()
      } catch (error) {
        console.error('[Payments] Failed to open customer portal:', error)
        throw error
      }
    },

    /**
     * Refresh subscription status
     */
    async refreshSubscriptionStatus(): Promise<{ isSubscribed: boolean }> {
      try {
        if (!authClient?.customer?.state) {
          console.warn('[Payments] Better Auth customer methods not available for refresh')
          return { isSubscribed: false }
        }
        const customerState = await authClient.customer.state()
        return {
          isSubscribed: (customerState?.data?.activeSubscriptions?.length ?? 0) > 0,
        }
      } catch (error) {
        console.error('[Payments] Failed to refresh subscription status:', error)
        return { isSubscribed: false }
      }
    },
  }
}

/**
 * Hook to get subscription status
 * This is a lower-level hook - consider using the pre-built useSubscriptionStatus from hooks/
 */
export function useSubscriptionStatusBase(options: PolarClientOptions = {}) {
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isSubscribed: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const polarUtils = createPolarUtils(options)

  const fetchSubscriptions = useCallback(async () => {
    try {
      // Only fetch if user is authenticated
      if (!options.session?.user?.id) {
        setSubscriptionStatus({ isSubscribed: false })
        setIsLoading(false)
        return
      }

      const status = await polarUtils.getSubscriptionStatus()
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('[Payments] Failed to fetch subscriptions:', error)
      setSubscriptionStatus({ isSubscribed: false })
    } finally {
      setIsLoading(false)
    }
  }, [options.session?.user?.id])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    await fetchSubscriptions()
  }, [fetchSubscriptions])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  return {
    subscriptions: [],
    isProSubscriber: subscriptionStatus.isSubscribed,
    isLoading,
    refresh,
  }
}

// Re-export types for client use
export type { SubscriptionStatus } from '../types'
