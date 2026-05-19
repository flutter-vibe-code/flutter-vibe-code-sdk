'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'success' | 'error' | null>(null)
  const searchParams = useSearchParams()
  const checkoutId = searchParams?.get('checkout_id')

  useEffect(() => {
    const verifySubscription = async () => {
      if (!checkoutId) {
        setSubscriptionStatus('error')
        setIsLoading(false)
        return
      }

      try {
        // In a real implementation, you would verify the checkout with your backend
        // For now, we'll assume success
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
        setSubscriptionStatus('success')
      } catch (error) {
        console.error('Failed to verify subscription:', error)
        setSubscriptionStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    verifySubscription()
  }, [checkoutId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Processing your subscription...</CardTitle>
            <CardDescription>
              Please wait while we confirm your Pro subscription.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (subscriptionStatus === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Subscription Error</CardTitle>
            <CardDescription>
              There was an issue processing your subscription. Please contact support.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline">
                Back to Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Welcome to Pro!</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully. You now have access to all Pro features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium mb-2">What&apos;s included:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Unlimited AI-powered code generation</li>
              <li>• Priority support</li>
              <li>• Advanced project templates</li>
              <li>• Extended session limits</li>
            </ul>
          </div>
          <div className="flex flex-col space-y-2">
            <Link href="/" className="w-full">
              <Button className="w-full">
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">
                View Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}