'use client'

export default function OmniRouteDashboard() {
  return (
    <div className="h-screen w-full">
      <iframe
        src="/api/omniroute-proxy/login"
        className="w-full h-full border-0"
        title="OmniRoute Dashboard"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
      />
    </div>
  )
}

