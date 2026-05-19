'use client'

import PusherClient from 'pusher-js'
import { useEffect, useState, useRef } from 'react'

export function useRemoteControlStatus({
  sandboxId,
  onComplete,
}: {
  sandboxId: string | null
  onComplete?: () => void
}) {
  const [isRemoteControlActive, setIsRemoteControlActive] = useState(false)
  const pusherRef = useRef<PusherClient | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!sandboxId) return

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
    pusherRef.current = pusher

    const channel = pusher.subscribe(`sandbox-${sandboxId}`)

    channel.bind('remote-control-start', () => {
      setIsRemoteControlActive(true)
    })

    channel.bind('remote-control-complete', () => {
      setIsRemoteControlActive(false)
      onCompleteRef.current?.()
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
      pusherRef.current = null
    }
  }, [sandboxId])

  return { isRemoteControlActive }
}
