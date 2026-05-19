'use client'

import { useState, useEffect } from 'react'

export function useDeviceWidth() {
  const [width, setWidth] = useState<number>(0)

  useEffect(() => {
    // Set initial width
    setWidth(window.innerWidth)

    // Handle resize
    const handleResize = () => {
      setWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return width
}