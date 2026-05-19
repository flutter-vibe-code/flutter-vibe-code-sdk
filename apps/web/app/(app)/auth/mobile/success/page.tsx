'use client'

import { useEffect } from 'react'

/**
 * Mobile OAuth Success Page
 *
 * This page is shown after Better Auth completes the OAuth flow.
 * It fetches the session and redirects back to the mobile app with the session data.
 */
export default function MobileAuthSuccessPage() {
  useEffect(() => {
    async function completeAuth() {
      try {

        // Fetch the session from Better Auth
        const response = await fetch('/api/auth/get-session', {
          credentials: 'include',
        })


        if (response.ok) {
          const session = await response.json()

          if (session?.user) {
            // Session is valid, redirect to mobile app with success
            // Use the capsule:// deep link scheme for production, or exp:// for Flutter dev
            window.location.href = 'capsule://auth-callback?success=true'
          } else {
            // No session found
            console.error('[Mobile Success] No user in session')
            window.location.href = 'capsule://auth-callback?error=no_session'
          }
        } else {
          console.error('[Mobile Success] Session fetch failed:', response.status)
          window.location.href = 'capsule://auth-callback?error=session_failed'
        }
      } catch (error) {
        console.error('[Mobile Success] Error:', error)
        window.location.href = `capsule://auth-callback?error=${encodeURIComponent('unknown_error')}`
      }
    }

    // Wait a moment to ensure cookies are set
    const timeout = setTimeout(completeAuth, 500)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1>Sign In Successful!</h1>
      <p>Returning to app...</p>
      <div style={{ marginTop: '20px' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
