'use client'

import { useState, useRef, useCallback } from 'react'

export interface UseAudioRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  audioBlob: Blob | null
  audioURL: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      setError(null)

      // Request audio permission with optimal settings for mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Optimal for speech recognition
          channelCount: 1, // Mono audio is sufficient for speech
        }
      })

      streamRef.current = stream

      // Determine the best audio format for the browser
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/mpeg')
        ? 'audio/mpeg'
        : MediaRecorder.isTypeSupported('audio/wav')
        ? 'audio/wav'
        : 'audio/webm' // Fallback

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // Good quality for speech
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioURL(url)
      }

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error)
        setError(`Recording error: ${event.error?.message || 'Unknown error'}`)
      }

      // Start recording with timeslice for better mobile performance
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setIsPaused(false)

    } catch (err: any) {
      console.error('Failed to start recording:', err)
      setError(err.message || 'Failed to start recording')
      throw err
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !streamRef.current) {
        resolve(null)
        return
      }

      const mediaRecorder = mediaRecorderRef.current

      // Set up listener for when stop is complete
      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioURL(url)

        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop())
        streamRef.current = null
        mediaRecorderRef.current = null

        resolve(blob)
      }

      // Stop recording
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }

      setIsRecording(false)
      setIsPaused(false)
    })
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
    }
  }, [])

  const resetRecording = useCallback(() => {
    // Clean up existing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioURL) {
      URL.revokeObjectURL(audioURL)
    }

    mediaRecorderRef.current = null
    chunksRef.current = []
    setIsRecording(false)
    setIsPaused(false)
    setAudioBlob(null)
    setAudioURL(null)
    setError(null)
  }, [audioURL])

  return {
    isRecording,
    isPaused,
    audioBlob,
    audioURL,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  }
}
