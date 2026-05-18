'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useCookieStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with default value
  const [storedValue, setStoredValue] = useState<T>(defaultValue)
  const isInitialized = useRef(false)

  // Function to get value from cookie
  const getCookieValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const cookies = document.cookie.split(';')
      const cookie = cookies.find(c => c.trim().startsWith(`${key}=`))
      
      if (cookie) {
        const value = cookie.split('=')[1]
        return JSON.parse(decodeURIComponent(value))
      }
      return defaultValue
    } catch (error) {
      console.warn(`Error reading cookie ${key}:`, error)
      return defaultValue
    }
  }, [key, defaultValue])

  // Function to set value to cookie
  const setCookieValue = useCallback((value: T) => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const encodedValue = encodeURIComponent(JSON.stringify(value))
      // Set cookie with 1 year expiration
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)
      document.cookie = `${key}=${encodedValue}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`
    } catch (error) {
      console.warn(`Error setting cookie ${key}:`, error)
    }
  }, [key])

  // Load initial value from cookie on mount (only once)
  useEffect(() => {
    if (!isInitialized.current) {
      const cookieValue = getCookieValue()
      setStoredValue(cookieValue)
      isInitialized.current = true
    }
  }, []) // Empty dependency array to run only once

  // Update function that handles both direct values and updater functions
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prevValue => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevValue) : value
      setCookieValue(newValue)
      return newValue
    })
  }, [setCookieValue])

  return [storedValue, setValue]
}