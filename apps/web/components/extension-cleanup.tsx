'use client'

import { useEffect } from 'react'

export function ExtensionCleanup() {
  useEffect(() => {
    const attrs = ['bis_skin_checked', 'bis_register', '__processed_']
    document.querySelectorAll('*').forEach((el: any) => {
      Array.from(el.attributes || []).forEach((attr: any) => {
        if (attrs.some(a => attr.name.startsWith(a) || attr.name === a)) {
          try { el.removeAttribute(attr.name) } catch {}
        }
      })
    })
  }, [])
  return null
}
