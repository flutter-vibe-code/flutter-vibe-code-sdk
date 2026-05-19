'use client'

import React, { createContext, useContext, useEffect, useCallback } from 'react'

interface KeyboardShortcutsContextType {
  registerShortcut: (key: string, callback: () => void) => void
  unregisterShortcut: (key: string) => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined)

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const shortcuts = React.useRef<Map<string, () => void>>(new Map())

  const registerShortcut = useCallback((key: string, callback: () => void) => {
    shortcuts.current.set(key, callback)
  }, [])

  const unregisterShortcut = useCallback((key: string) => {
    shortcuts.current.delete(key)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? e.metaKey : e.ctrlKey

      if (modifierKey && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        const callback = shortcuts.current.get('focus-input')
        if (callback) {
          callback()
        }
      }

      if (modifierKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        const callback = shortcuts.current.get('toggle-edit')
        if (callback) {
          callback()
        }
      }

      if (modifierKey && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        const callback = shortcuts.current.get('toggle-recording')
        if (callback) {
          callback()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <KeyboardShortcutsContext.Provider value={{ registerShortcut, unregisterShortcut }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (context === undefined) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider')
  }
  return context
}
