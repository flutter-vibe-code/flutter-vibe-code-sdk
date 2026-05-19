'use client'

import { useIsMobile } from '@/hooks/use-mobile'

export function TestMobileDetection() {
  const isMobile = useIsMobile()
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Mobile Detection Test</h3>
      <p>Is Mobile: {isMobile ? 'YES' : 'NO'}</p>
      <p>Screen Width: {typeof window !== 'undefined' ? window.innerWidth : 'Unknown'}</p>
      <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}</p>
    </div>
  )
}