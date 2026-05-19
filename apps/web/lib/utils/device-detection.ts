export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile',
    'tablet',
    'samsung',
    'nokia',
    'motorola',
    'lg',
    'sony',
    'htc'
  ]
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
  
  // Check viewport width for smaller screens (typical mobile/tablet)
  const isSmallScreen = window.innerWidth <= 1024
  
  // Check for specific mobile patterns
  const mobilePatterns = [
    /android/i,
    /webos/i,
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /mobile/i,
    /tablet/i,
    /kindle/i,
    /silk/i,
    /opera mini/i,
    /opera mobi/i
  ]
  
  const matchesMobilePattern = mobilePatterns.some(pattern => pattern.test(userAgent))
  
  // Return true if any mobile indicator is present
  return hasTouch && (isMobileUA || matchesMobilePattern || (isSmallScreen && hasTouch))
}

export function isDesktop(): boolean {
  return !isMobileDevice()
}

export function isSafari(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  return /safari/.test(userAgent) && !/chrome/.test(userAgent)
}

export function isMobileSafari(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/crios/.test(userAgent)
}