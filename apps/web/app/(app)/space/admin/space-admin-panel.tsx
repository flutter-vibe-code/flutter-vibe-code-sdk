'use client'

import { useState, useEffect, useCallback } from 'react'

interface SpaceSend {
  id: string
  templateName: string
  subject: string
  recipientCount: number
  sentAt: string
}

interface SendStatus {
  templateName: string
  totalWaitlist: number
  sentCount: number
  pendingCount: number
  sent: { email: string; sentAt: string }[]
  pending: { email: string }[]
}

const SPACE_TEMPLATES = [
  { name: 'space_launch', subject: 'Flutter Space is live' },
]

export function SpaceAdminPanel() {
  const [sends, setSends] = useState<SpaceSend[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testEmail, setTestEmail] = useState('rodrigofigueroa.name@gmail.com')
  const [sendingTest, setSendingTest] = useState(false)
  const [status, setStatus] = useState<SendStatus | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchStatus = useCallback(async (template: string) => {
    const res = await fetch(`/api/space-admin/status?template=${template}`)
    if (res.ok) {
      const data = await res.json()
      setStatus(data)
    }
  }, [])

  useEffect(() => {
    if (selectedTemplate) {
      fetchStatus(selectedTemplate)
    } else {
      setStatus(null)
    }
  }, [selectedTemplate, fetchStatus])

  async function fetchHistory() {
    const res = await fetch('/api/space-admin/history')
    if (res.ok) {
      const data = await res.json()
      setSends(data)
    }
  }

  async function handleSend() {
    if (!selectedTemplate) return
    const pendingCount = status?.pendingCount || 0
    if (!confirm(`Send "${selectedTemplate}" to ${pendingCount} waitlist subscribers? This cannot be undone.`)) return

    setSending(true)
    setMessage(null)

    try {
      const res = await fetch('/api/space-admin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateName: selectedTemplate }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: `Sent to ${data.sentCount} subscribers!` })
        fetchHistory()
        fetchStatus(selectedTemplate)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSending(false)
    }
  }

  async function handleSendTest() {
    if (!selectedTemplate || !testEmail) return

    setSendingTest(true)
    setMessage(null)

    try {
      const res = await fetch('/api/space-admin/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateName: selectedTemplate, testEmail }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: `Test email sent to ${testEmail}` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSendingTest(false)
    }
  }

  const canSend = status && status.pendingCount > 0

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    background: '#141414',
    border: '1px solid #262626',
    borderRadius: '6px',
    color: '#e5e5e5',
    outline: 'none',
  }

  const btnPrimary = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer' as const,
  }

  const btnSecondary = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    background: '#1a1a1a',
    color: '#a3a3a3',
    border: '1px solid #262626',
    borderRadius: '6px',
    cursor: 'pointer' as const,
  }

  const sectionStyle = {
    border: '1px solid #262626',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '32px',
  }

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
          Space Admin
        </h1>
        <p style={{ color: '#525252', fontSize: '14px', margin: '4px 0 0' }}>
          Manage Flutter Space waitlist emails
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '24px',
            background: message.type === 'success' ? '#052e16' : '#450a0a',
            color: message.type === 'success' ? '#34d399' : '#fca5a5',
            border: `1px solid ${message.type === 'success' ? '#064e3b' : '#7f1d1d'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Send Email */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px' }}>
          Send to Waitlist
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#737373', display: 'block', marginBottom: '8px' }}>
            Select Template
          </label>
          {SPACE_TEMPLATES.map((t) => (
            <label
              key={t.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                borderRadius: '6px',
                border: `1px solid ${selectedTemplate === t.name ? '#0ea5e9' : '#262626'}`,
                background: selectedTemplate === t.name ? 'rgba(14,165,233,0.05)' : 'transparent',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              <input
                type="radio"
                name="template"
                value={t.name}
                checked={selectedTemplate === t.name}
                onChange={() => setSelectedTemplate(t.name)}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedTemplate === t.name ? '#0ea5e9' : '#404040'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {selectedTemplate === t.name && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{t.name}</div>
                <div style={{ fontSize: '13px', color: '#525252' }}>{t.subject}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Status */}
        {status && selectedTemplate && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Progress: {status.sentCount} / {status.totalWaitlist} sent</span>
              <span style={{ color: '#525252' }}>{status.pendingCount} pending</span>
            </div>
            <div style={{ width: '100%', background: '#1a1a1a', borderRadius: '4px', height: '6px' }}>
              <div
                style={{
                  width: `${status.totalWaitlist > 0 ? (status.sentCount / status.totalWaitlist) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)',
                  borderRadius: '4px',
                  height: '6px',
                  transition: 'width 0.3s',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div style={{ border: '1px solid #262626', borderRadius: '6px', padding: '12px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#34d399', margin: '0 0 8px' }}>
                  Sent ({status.sent.length})
                </h3>
                <div style={{ maxHeight: '120px', overflow: 'auto' }}>
                  {status.sent.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#404040' }}>None yet</p>
                  ) : (
                    status.sent.map((r) => (
                      <div key={r.email} style={{ fontSize: '12px', color: '#737373', padding: '2px 0' }}>
                        {r.email}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div style={{ border: '1px solid #262626', borderRadius: '6px', padding: '12px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#fbbf24', margin: '0 0 8px' }}>
                  Pending ({status.pending.length})
                </h3>
                <div style={{ maxHeight: '120px', overflow: 'auto' }}>
                  {status.pending.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#404040' }}>All sent</p>
                  ) : (
                    status.pending.map((u) => (
                      <div key={u.email} style={{ fontSize: '12px', color: '#737373', padding: '2px 0' }}>
                        {u.email}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {selectedTemplate && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#737373', display: 'block', marginBottom: '8px' }}>
              Preview
            </label>
            <iframe
              src={`/api/email-preview?template=${selectedTemplate}`}
              style={{ width: '100%', height: '500px', border: '1px solid #262626', borderRadius: '6px', background: '#0a0a0a' }}
              title="Email Preview"
            />
          </div>
        )}

        {/* Test email */}
        {selectedTemplate && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '16px', padding: '16px', background: '#111', borderRadius: '6px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#737373', display: 'block', marginBottom: '6px' }}>
                Send Test Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                style={inputStyle}
              />
            </div>
            <button
              onClick={handleSendTest}
              disabled={!testEmail || sendingTest}
              style={{ ...btnSecondary, opacity: !testEmail || sendingTest ? 0.5 : 1, flexShrink: 0 }}
            >
              {sendingTest ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!selectedTemplate || sending || !canSend}
          style={{
            ...btnPrimary,
            opacity: !selectedTemplate || sending || !canSend ? 0.5 : 1,
            cursor: !selectedTemplate || sending || !canSend ? 'not-allowed' : 'pointer',
          }}
        >
          {sending
            ? 'Sending...'
            : status && status.pendingCount === 0
              ? 'All Subscribers Sent'
              : `Send to All (${status?.pendingCount || 0} pending)`}
        </button>
      </section>

      {/* Send History */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px' }}>
          Send History
        </h2>

        {sends.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#404040' }}>No emails sent yet.</p>
        ) : (
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #262626' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 500, color: '#737373' }}>Template</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 500, color: '#737373' }}>Subject</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 500, color: '#737373' }}>Recipients</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 500, color: '#737373' }}>Sent</th>
              </tr>
            </thead>
            <tbody>
              {sends.map((send) => (
                <tr key={send.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: '12px' }}>{send.templateName}</td>
                  <td style={{ padding: '10px 8px' }}>{send.subject}</td>
                  <td style={{ padding: '10px 8px' }}>{send.recipientCount}</td>
                  <td style={{ padding: '10px 8px', color: '#525252' }}>
                    {new Date(send.sentAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
