'use client'

import { useState, useEffect } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check screen width
      const isMobileScreen = window.innerWidth <= 768
      
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      
      // Consider it mobile if either condition is true
      setIsMobile(isMobileScreen || isMobileUA)
    }

    // Initial check
    checkMobile()

    // Listen for window resize
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}