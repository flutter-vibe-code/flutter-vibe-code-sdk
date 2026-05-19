'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { signInWithGoogle } from '@/lib/auth/client'
import { AlertCircle, Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import * as SimpleIcons from 'simple-icons'

interface AuthProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  callbackURL?: string
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: SimpleIcons.siGoogle.svg }}
    />
  )
}

export default function Auth({ onSuccess, onError, callbackURL }: AuthProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

      // Better Auth should redirect automatically
      const result = await signInWithGoogle(callbackURL)

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to sign in with Google')
      }

      // If we reach here without redirect, call onSuccess
      // onSuccess?.()
    } catch (err: any) {
      console.error('Google sign-in error:', err)
      const errorMessage = err.message || 'Failed to sign in with Google'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to continue to your account
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleGoogleSignIn}
        disabled={loading}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="h-4 w-4" />
        )}
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}
