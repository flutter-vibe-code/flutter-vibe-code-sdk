'use client'

import { useState } from 'react'

export default function SpacePage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/space/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage("You're on the list.")
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Try again.')
    }
  }

  return (
    <>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div
      style={{
        height: '100vh',
        width: '100%',
        background: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Segoe UI Mono", Menlo, Monaco, Consolas, monospace',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }}
      />

      {/* Gradient glow behind content */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '640px',
          width: '100%',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: 500,
            letterSpacing: '4px',
            textTransform: 'uppercase' as const,
            color: '#525252',
          }}
        >
          Flutter Space
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.1,
              margin: 0,
              background: 'linear-gradient(to bottom right, #f5f5f5 0%, #a3a3a3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Segoe UI Mono", Menlo, Monaco, Consolas, monospace',
            }}
          >
            The meta-framework for
            <br />
            professional Flutter
          </h1>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: '#737373',
              margin: 0,
              maxWidth: '590px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            A meta agentic framework and software setup to fly when creating
            Flutter apps. Runs on your subscription and CLI agent of choice.
            The best config. The most powerful code agent setup and subagent execution layer. Built for
            professional developers. It includes Expo skills, steps for running tests and agent testing on devices or simulator for you.
          </p>

          <p
            style={{
              fontSize: '13px',
              color: '#525252',
              margin: 0,
            }}
          >
            Open source. Coming soon.
          </p>
        </div>

        {/* Email form / Success card */}
        {status === 'success' ? (
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#f5f5f5', margin: 0 }}>
              You&apos;re in!
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#737373', margin: 0 }}>
              You&apos;ll be the first to know about the release. Stay tuned — the
              project is almost done in its final phase.
            </p>
            <p style={{ fontSize: '14px', color: '#737373', margin: 0 }}>
              Follow{' '}
              <a
                href="https://x.com/bidah"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#e5e5e5', textDecoration: 'underline', fontWeight: 500 }}
              >
                @bidah
              </a>{' '}
              for the latest updates on the project.
            </p>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                gap: '8px',
                width: '100%',
                maxWidth: '420px',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status === 'error') setStatus('idle')
                }}
                placeholder="you@email.com"
                required
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  background: '#141414',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#e5e5e5',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0ea5e9')}
                onBlur={(e) => (e.target.style.borderColor = '#262626')}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  background: '#ffffff',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: status === 'loading' ? 0.85 : 1,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {status === 'loading' && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <circle cx="8" cy="8" r="6" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="8" opacity="0.4" />
                    <circle cx="8" cy="8" r="6" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="20" />
                  </svg>
                )}
                {status === 'loading' ? 'Joining...' : 'Join the Launch'}
              </button>
            </form>

            {/* Error message */}
            {status === 'error' && message && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#ef4444',
                  margin: '-24px 0 0 0',
                }}
              >
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
    </>
  )
}
