'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from 'react'

interface MicrophoneContextType {
  microphone: MediaRecorder | null
  startMicrophone: () => void
  stopMicrophone: () => void
  setupMicrophone: () => void
  microphoneState: MicrophoneState | null
}

export enum MicrophoneEvents {
  DataAvailable = 'dataavailable',
  Error = 'error',
  Pause = 'pause',
  Resume = 'resume',
  Start = 'start',
  Stop = 'stop',
}

export enum MicrophoneState {
  NotSetup = -1,
  SettingUp = 0,
  Ready = 1,
  Opening = 2,
  Open = 3,
  Error = 4,
  Pausing = 5,
  Paused = 6,
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(
  undefined
)

interface MicrophoneContextProviderProps {
  children: ReactNode
}

export const MicrophoneContextProvider: React.FC<MicrophoneContextProviderProps> = ({
  children,
}) => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup
  )
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null)

  const setupMicrophone = async () => {
    setMicrophoneState(MicrophoneState.SettingUp)

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      })

      const microphone = new MediaRecorder(userMedia)

      setMicrophoneState(MicrophoneState.Ready)
      setMicrophone(microphone)
    } catch (err: any) {
      console.error(err)

      throw err
    }
  }

  const stopMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Pausing)

    if (microphone?.state === 'recording') {
      microphone.stop()
      setMicrophoneState(MicrophoneState.Ready)
    } else if (microphone?.state === 'paused') {
      microphone.stop()
      setMicrophoneState(MicrophoneState.Ready)
    }
  }, [microphone])

  const startMicrophone = useCallback(() => {
    if (!microphone) return
    
    setMicrophoneState(MicrophoneState.Opening)

    if (microphone.state === 'inactive') {
      microphone.start(250)
      setMicrophoneState(MicrophoneState.Open)
    } else if (microphone.state === 'paused') {
      microphone.resume()
      setMicrophoneState(MicrophoneState.Open)
    }
    // If already recording, do nothing
  }, [microphone])

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  )
}

export function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext)

  if (context === undefined) {
    throw new Error(
      'useMicrophone must be used within a MicrophoneContextProvider'
    )
  }

  return context
}