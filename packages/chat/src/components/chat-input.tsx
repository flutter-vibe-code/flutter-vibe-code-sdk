'use client'

import { Button } from '@flutter-vibe-code/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@flutter-vibe-code/ui/components/tooltip'
import { cn } from '@flutter-vibe-code/ui/lib/utils'
import { ArrowUp, Square, Mic, MicOff, Image as ImageIcon } from 'lucide-react'
import type React from 'react'
import { type ReactNode, type SetStateAction, useEffect, useMemo, useState, useRef } from 'react'
import { useAudioRecorder } from '../hooks/use-audio-recorder'

export interface AISkill {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
}

interface ChatRequestOptions {
  body?: Record<string, unknown>
  data?: Record<string, unknown>
}

export interface ChatInputProps {
  retry: () => void
  isErrored: boolean
  errorMessage: string
  isLoading: boolean
  isRateLimited: boolean
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: ChatRequestOptions) => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (change: SetStateAction<File[]>) => void
  hideHoverModeToggle: boolean
  disabled?: boolean
  isAuthenticated?: boolean
  selectedModel: string
  onModelChange: (modelId: string) => void
  onSkillsChange?: (skills: AISkill[]) => void
  suggestionTip?: string
  /** Custom transcription function - if not provided, uses /api/transcribe */
  transcribeAudio?: (audioBlob: Blob) => Promise<string>
  /** Render function for the editor */
  renderEditor: (props: {
    placeholder: string
    disabled: boolean
    onContentChange: (text: string, skills: AISkill[]) => void
    onSubmit: () => void
    className?: string
    ref?: React.RefObject<any>
  }) => ReactNode
  /** Render function for the model selector */
  renderModelSelector: (props: {
    value: string
    onChange: (modelId: string) => void
    disabled: boolean
    compact?: boolean
  }) => ReactNode
  /** Render function for animated placeholder */
  renderPlaceholder?: (props: { width: number }) => ReactNode
  /** Recording sound URL */
  recordingSoundUrl?: string
}

export function ChatInput({
  retry,
  isErrored,
  errorMessage,
  isLoading,
  isRateLimited,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  hideHoverModeToggle,
  disabled = false,
  isAuthenticated = false,
  selectedModel,
  onModelChange,
  onSkillsChange,
  suggestionTip,
  transcribeAudio: customTranscribe,
  renderEditor,
  renderModelSelector,
  renderPlaceholder,
  recordingSoundUrl = 'https://etq42zw2k4.ufs.sh/f/Ygf2KSyPE9xcc8MKS2xOv0clTFLAMPxRXIetKY3VjanB6wEr',
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const baseInputRef = useRef<string>('')
  const recordSoundRef = useRef<HTMLAudioElement | null>(null)
  const editorRef = useRef<any>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [selectedSkills, setSelectedSkills] = useState<AISkill[]>([])
  const [editorWidth, setEditorWidth] = useState<number>(0)

  // Audio recorder for Whisper transcription
  const audioRecorder = useAudioRecorder()

  // Transcribe audio using provided function or default API
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    if (customTranscribe) {
      return customTranscribe(audioBlob)
    }

    try {
      setIsTranscribing(true)

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to transcribe audio'
        throw new Error(errorMessage)
      }

      const { text } = await response.json()
      return text
    } catch (error) {
      console.error('Transcription error:', error)
      throw error
    } finally {
      setIsTranscribing(false)
    }
  }

  // Handle editor content changes
  const handleEditorContentChange = (text: string, skills: AISkill[]) => {
    setSelectedSkills(skills)
    onSkillsChange?.(skills)
    // Simulate a textarea change event for compatibility
    const event = {
      target: { value: text },
    } as React.ChangeEvent<HTMLTextAreaElement>
    handleInputChange(event)
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        // Store the current input when starting recording
        baseInputRef.current = input

        // Play preloaded sound when starting to record
        if (recordSoundRef.current) {
          recordSoundRef.current.currentTime = 0
          recordSoundRef.current.play().catch(err => console.error('Audio play failed:', err))
        }

        await audioRecorder.startRecording()
        setIsRecording(true)
      } catch (err) {
        console.error('Failed to start audio recording:', err)
      }
    } else {
      try {
        const audioBlob = await audioRecorder.stopRecording()
        setIsRecording(false)

        if (audioBlob) {
          try {
            const transcription = await transcribeAudio(audioBlob)
            if (transcription) {
              const fullText = baseInputRef.current + (baseInputRef.current ? ' ' : '') + transcription
              if (editorRef.current?.setContent) {
                editorRef.current.setContent(fullText)
              } else {
                const event = {
                  target: { value: fullText },
                } as React.ChangeEvent<HTMLTextAreaElement>
                handleInputChange(event)
              }
            }
          } catch (transcriptionError: any) {
            const errorMsg = transcriptionError.message || 'Failed to transcribe audio'
            alert(`Transcription failed: ${errorMsg}\n\nPlease try recording a shorter message.`)
          }
        }

        audioRecorder.resetRecording()
      } catch (err) {
        console.error('Failed to stop recording:', err)
        setIsRecording(false)
        audioRecorder.resetRecording()
      }
    }
  }

  // Preload the recording sound
  useEffect(() => {
    const audio = new Audio(recordingSoundUrl)
    audio.volume = 0.5
    audio.preload = 'auto'
    recordSoundRef.current = audio
    audio.load()
  }, [recordingSoundUrl])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const isFileInArray = (file: File, arr: File[]) =>
      arr.some(f => f.name === file.name && f.size === file.size)

    handleFileChange((prev) => {
      const newFiles = Array.from(e.target.files || [])
      const uniqueFiles = newFiles.filter((file) => !isFileInArray(file, prev))
      return [...prev, ...uniqueFiles]
    })
  }

  function handleFileRemove(file: File) {
    handleFileChange((prev) => prev.filter((f) => f !== file))
  }

  const [dragActive, setDragActive] = useState(false)

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const isFileInArray = (file: File, arr: File[]) =>
      arr.some(f => f.name === file.name && f.size === file.size)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (droppedFiles.length > 0) {
      handleFileChange((prev) => {
        const uniqueFiles = droppedFiles.filter(
          (file) => !isFileInArray(file, prev),
        )
        return [...prev, ...uniqueFiles]
      })
    }
  }

  const filePreview = useMemo(() => {
    if (files.length === 0) return null
    return Array.from(files).map((file) => {
      return (
        <div className="relative" key={file.name}>
          <span
            onClick={() => handleFileRemove(file)}
            className="absolute top-[-8] right-[-8] bg-muted rounded-full p-1"
          >
            <span className="h-3 w-3 cursor-pointer">×</span>
          </span>
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="rounded-xl w-10 h-10 object-cover"
          />
        </div>
      )
    })
  }, [files])

  // Enhanced submit handler that includes skills
  const enhancedHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const options: ChatRequestOptions = {}

    if (selectedSkills.length > 0) {
      options.body = {
        skills: selectedSkills.map(skill => skill.id),
      }
    }

    handleSubmit(e, Object.keys(options).length > 0 ? options : undefined)
  }

  const handleEditorSubmit = () => {
    if (input.trim()) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true }) as any
      submitEvent.preventDefault = () => {}
      enhancedHandleSubmit(submitEvent as React.FormEvent<HTMLFormElement>)
    }
  }

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
    }
  }, [isMultiModal, handleFileChange])

  // Capture editor width for placeholder animation
  useEffect(() => {
    const updateWidth = () => {
      if (editorContainerRef.current) {
        setEditorWidth(editorContainerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)

    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return (
    <form
      onSubmit={enhancedHandleSubmit}
      className="mb-2 mt-auto flex flex-col bg-background max-w-[755px] mx-auto"
      onDragEnter={isMultiModal ? handleDrag : undefined}
      onDragLeave={isMultiModal ? handleDrag : undefined}
      onDragOver={isMultiModal ? handleDrag : undefined}
      onDrop={isMultiModal ? handleDrop : undefined}
    >
      {suggestionTip && (
        <div className="flex items-center py-3 text-sm mb-4 rounded-xl bg-muted/50 text-muted-foreground border border-border/50">
          <span className="flex-1">
            On chat input type <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono bg-gray-600 text-bold text-white">/</code> to select the <strong>{suggestionTip}</strong> integration
          </span>
        </div>
      )}
      {isErrored && (
        <div
          className={`flex items-center p-1.5 text-sm font-medium mx-4 mb-10 rounded-xl ${
            isRateLimited
              ? 'bg-orange-400/10 text-orange-400'
              : 'bg-red-400/10 text-red-400'
          }`}
        >
          <span className="flex-1 px-1.5">{errorMessage}</span>
          <button
            className={`px-2 py-1 rounded-sm ${
              isRateLimited ? 'bg-orange-400/20' : 'bg-red-400/20'
            }`}
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}
      <div className="relative">
        <div
          className={`shadow-md rounded-2xl relative z-10 bg-background border pt-2 mb-4 ${
            dragActive
              ? 'before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-dashed before:border-primary'
              : ''
          }`}
        >
          {/* Image previews */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {filePreview}
            </div>
          )}
          <div className="relative px-3 pt-2" ref={editorContainerRef}>
            {!input && editorWidth > 0 && renderPlaceholder && (
              <div className="absolute top-0 left-0 pointer-events-none z-0 px-3 pt-2">
                <div className="absolute -right-[-8px] w-[10px] h-[23px] bg-white dark:bg-primary-foreground"/>
                {renderPlaceholder({ width: editorWidth - 24 })}
              </div>
            )}
            {renderEditor({
              ref: editorRef,
              placeholder: isRecording
                ? 'Recording...'
                : isTranscribing
                ? 'Transcribing...'
                : '',
              disabled: isErrored || disabled,
              onContentChange: handleEditorContentChange,
              onSubmit: handleEditorSubmit,
              className: 'min-h-[3rem] w-full relative z-10',
            })}
          </div>
          <div className="flex p-3 gap-2 items-center justify-between">
            <input
              type="file"
              id="multimodal"
              name="multimodal"
              accept="image/*"
              multiple={true}
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="flex items-center gap-2">
              {renderModelSelector({
                value: selectedModel,
                onChange: onModelChange,
                disabled: isLoading || isErrored,
                compact: true,
              })}
            </div>

            <div className="flex gap-2">
              {/* Image upload button */}
              {isMultiModal && (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-10 w-10"
                        disabled={isLoading || isErrored}
                        onClick={() => document.getElementById('multimodal')?.click()}
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach images</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Voice recording button - only show when authenticated */}
              {isAuthenticated && (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={toggleRecording}
                        disabled={isTranscribing || isLoading}
                        size="icon"
                        variant={isRecording ? "destructive" : "outline"}
                        className="rounded-xl h-10 w-10"
                      >
                        {isTranscribing ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : isRecording ? (
                          <MicOff className="h-5 w-5" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isTranscribing
                        ? "Transcribing audio..."
                        : isRecording
                        ? "Stop recording"
                        : "Record audio"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {!isLoading ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={isErrored || disabled}
                        variant="default"
                        size="icon"
                        type="submit"
                        className="rounded-xl h-10 w-10"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-xl h-10 w-10"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.preventDefault()
                          stop()
                        }}
                      >
                        <Square className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
