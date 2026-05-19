'use client'

import PusherClient from 'pusher-js'

let pusherClientInstance: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    if (
      !process.env.NEXT_PUBLIC_PUSHER_APP_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      throw new Error('Missing Pusher client environment variables')
    }

    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      }
    )
  }

  return pusherClientInstance
}

// Legacy export for backward compatibility - uses Proxy to forward all method calls
export const pusherClient = new Proxy({} as PusherClient, {
  get(_target, prop) {
    const client = getPusherClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export { PusherClient }
