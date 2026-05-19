'use client'

import {
  createClient,
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvents,
  type LiveSchema,
  type LiveTranscriptionEvent,
} from '@deepgram/sdk'
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  FunctionComponent,
} from 'react'

interface DeepgramContextType {
  connection: LiveClient | null
  connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>
  disconnectFromDeepgram: () => void
  connectionState: LiveConnectionState
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(
  undefined
)

interface DeepgramContextProviderProps {
  children: ReactNode
}

const getToken = async (): Promise<string> => {
  const response = await fetch("/api/authenticate", { cache: "no-store" })
  const result = await response.json()
  return result.key
}

export const DeepgramContextProvider: FunctionComponent<
  DeepgramContextProviderProps
> = ({ children }) => {
  const [connection, setConnection] = useState<LiveClient | null>(null)
  const [connectionState, setConnectionState] = useState<LiveConnectionState>(
    LiveConnectionState.CLOSED
  )

  const connectToDeepgram = async (options: LiveSchema, endpoint?: string) => {
    const token = await getToken()
    const deepgram = createClient(token)

    const conn = deepgram.listen.live(options, endpoint)

    conn.addListener(LiveTranscriptionEvents.Open, () => {
      setConnectionState(LiveConnectionState.OPEN)
    })

    conn.addListener(LiveTranscriptionEvents.Close, () => {
      setConnectionState(LiveConnectionState.CLOSED)
    })

    setConnection(conn)
  }

  const disconnectFromDeepgram = async () => {
    if (connection) {
      connection.finish()
      setConnection(null)
    }
  }

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  )
}

export function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext)
  if (context === undefined) {
    throw new Error(
      'useDeepgram must be used within a DeepgramContextProvider'
    )
  }
  return context
}

export {
  LiveConnectionState,
  LiveTranscriptionEvents,
  type LiveTranscriptionEvent,
}