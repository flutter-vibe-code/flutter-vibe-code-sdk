'use client'

import { createContext, useContext, useRef, ReactNode, MutableRefObject } from 'react'
import { createPortal } from 'react-dom'

interface MobilePortalContextValue {
  headerPortalRef: MutableRefObject<HTMLDivElement | null>
  tabBarPortalRef: MutableRefObject<HTMLDivElement | null>
}

const MobilePortalContext = createContext<MobilePortalContextValue | null>(null)

export function MobilePortalProvider({ children }: { children: ReactNode }) {
  const headerPortalRef = useRef<HTMLDivElement | null>(null)
  const tabBarPortalRef = useRef<HTMLDivElement | null>(null)

  return (
    <MobilePortalContext.Provider value={{ headerPortalRef, tabBarPortalRef }}>
      <div className="relative h-full">
        {/* Portal containers for mobile header and tab bar - only visible on mobile */}
        <div 
          ref={headerPortalRef} 
          id="mobile-header-portal" 
          className="fixed top-0 left-0 right-0 z-50 md:hidden"
        />
        <div 
          ref={tabBarPortalRef} 
          id="mobile-tab-bar-portal" 
          className="fixed left-0 right-0 z-40 md:hidden"
          style={{ top: '58px' }}
        />
        {/* Main content */}
        <div className="h-full">
          {children}
        </div>
      </div>
    </MobilePortalContext.Provider>
  )
}

export function useMobilePortals() {
  const context = useContext(MobilePortalContext)
  if (!context) {
    throw new Error('useMobilePortals must be used within MobilePortalProvider')
  }
  return context
}

interface MobileHeaderPortalProps {
  children: ReactNode
  isMobile: boolean
}

export function MobileHeaderPortal({ children, isMobile }: MobileHeaderPortalProps) {
  const context = useContext(MobilePortalContext)
  
  // Don't render anything on desktop
  if (!isMobile) {
    return null
  }
  
  // Only render through portal if container is available
  if (!context?.headerPortalRef.current) {
    return null
  }
  
  return createPortal(children, context.headerPortalRef.current)
}

interface MobileTabBarPortalProps {
  children: ReactNode | ((props: any) => ReactNode)
  isMobile: boolean
  [key: string]: any
}

export function MobileTabBarPortal({ children, isMobile, ...props }: MobileTabBarPortalProps) {
  const context = useContext(MobilePortalContext)
  
  if (!isMobile || !context?.tabBarPortalRef.current) {
    return null
  }
  
  const content = typeof children === 'function' ? children(props) : children
  
  return createPortal(content, context.tabBarPortalRef.current)
}