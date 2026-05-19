'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface DevModeContextType {
  isDevMode: boolean
  setIsDevMode: (enabled: boolean) => void
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined)

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [isDevMode, setIsDevModeState] = useState(true)

  // Load dev mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('devMode')
    if (stored !== null) {
      setIsDevModeState(stored === 'true')
    }
  }, [])

  // Persist dev mode to localStorage
  const setIsDevMode = (enabled: boolean) => {
    setIsDevModeState(enabled)
    localStorage.setItem('devMode', enabled.toString())
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('devModeChanged'))
  }

  return (
    <DevModeContext.Provider value={{ isDevMode, setIsDevMode }}>
      {children}
    </DevModeContext.Provider>
  )
}

export function useDevMode() {
  const context = useContext(DevModeContext)
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider')
  }
  return context
}
