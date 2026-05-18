'use client'

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useCookieStorage } from '@/hooks/useCookieStorage'

export type ViewMode = 'mobile' | 'desktop' | 'both' | 'mobile-qr'

interface ViewModeContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useCookieStorage<ViewMode>('viewMode', 'mobile-qr')
  const [isDevMode, setIsDevMode] = useState(false)

  // Load dev mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('devMode')
    setIsDevMode(stored === 'true')
  }, [])

  // Listen for dev mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('devMode')
      setIsDevMode(stored === 'true')
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event for same-tab updates
    window.addEventListener('devModeChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('devModeChanged', handleStorageChange)
    }
  }, [])

  const toggleViewMode = useCallback(() => {
    console.log('[ViewModeContext] Toggling view mode from:', viewMode)
    console.log('[ViewModeContext] Dev mode is:', isDevMode)
    let nextMode: ViewMode

    // If dev mode is disabled, cycle: mobile-qr -> desktop -> both -> mobile-qr
    if (!isDevMode) {
      switch (viewMode) {
        case 'mobile-qr':
          nextMode = 'desktop'
          break
        case 'desktop':
          nextMode = 'both'
          break
        case 'both':
          nextMode = 'mobile-qr'
          break
        case 'mobile':
          // If somehow in mobile mode without dev mode, go to mobile-qr
          nextMode = 'mobile-qr'
          break
        default:
          nextMode = 'mobile-qr'
          break
      }
    } else {
      // Dev mode enabled - cycle through all modes: mobile -> mobile-qr -> desktop -> both -> mobile
      switch (viewMode) {
        case 'mobile':
          nextMode = 'mobile-qr'
          break
        case 'mobile-qr':
          nextMode = 'desktop'
          break
        case 'desktop':
          nextMode = 'both'
          break
        case 'both':
          nextMode = 'mobile'
          break
        default:
          nextMode = 'mobile-qr'
          break
      }
    }

    console.log('[ViewModeContext] Setting view mode to:', nextMode)
    setViewMode(nextMode)
  }, [viewMode, setViewMode, isDevMode])

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const context = useContext(ViewModeContext)
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider')
  }
  return context
}