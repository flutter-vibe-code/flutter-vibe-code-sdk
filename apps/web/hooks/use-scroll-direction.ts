'use client'

import { useState, useEffect } from 'react'

interface UseScrollDirectionOptions {
  threshold?: number
  debounceTime?: number
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, debounceTime = 100 } = options
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'none'>('none')
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const difference = scrollY - lastScrollY

      // Set scrolled state
      setIsScrolled(scrollY > threshold)

      // Only update direction if the difference is significant enough
      if (Math.abs(difference) > threshold) {
        if (difference > 0) {
          setScrollDirection('down')
        } else {
          setScrollDirection('up')
        }
        setLastScrollY(scrollY)
      }
    }

    const handleScroll = () => {
      // Debounce scroll events
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(updateScrollDirection, debounceTime)
    }

    // Set initial values
    setLastScrollY(window.scrollY)
    setIsScrolled(window.scrollY > threshold)

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [lastScrollY, threshold, debounceTime])

  return { scrollDirection, isScrolled }
}