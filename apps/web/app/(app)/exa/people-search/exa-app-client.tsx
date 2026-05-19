'use client'

import { ChatInput } from '@/components/chat-input'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { TemplateId } from '@/lib/templates'
import { useRouter } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { SetStateAction, useEffect, useState } from 'react'
import { useCookieStorage } from '@/hooks/useCookieStorage'
import { useClaudeModel } from '@/hooks/use-claude-model'
import { v4 as uuidv4 } from 'uuid'
import { useToast } from '@/components/ui/use-toast'
import { AuthDialog } from '@/components/auth-dialog'
import { ImageAttachment } from '@/components/chat-panel-input'
import type { AISkill } from '@/lib/skills'
import { useSession } from '@/lib/auth/client'

export function ExaAppClient() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, isPending } = useSession()

  // Use cookie storage in development, useState in production
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Always call both hooks, but only use the one we need
  const [chatInputCookie, setChatInputCookie] = useCookieStorage('exa-chat', '')
  const [chatInputState, setChatInputState] = useState('')
  const chatInput = isDevelopment ? chatInputCookie : chatInputState
  const setChatInput = isDevelopment ? setChatInputCookie : setChatInputState

  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate] = useState<'auto' | TemplateId>('flutter')
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<AISkill[]>([])

  const [languageModelCookie, setLanguageModelCookie] = useCookieStorage<LLMModelConfig>(
    'languageModel',
    {
      model: 'claude-3-5-sonnet-latest',
    },
  )
  const [languageModelState, setLanguageModelState] = useState<LLMModelConfig>({
    model: 'claude-3-5-sonnet-latest',
  })
  const languageModel = isDevelopment ? languageModelCookie : languageModelState
  const setLanguageModel = isDevelopment ? setLanguageModelCookie : setLanguageModelState

  const posthog = usePostHog()
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const { selectedModel, setSelectedModel } = useClaudeModel()

  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== 'ollama'
    }
    return true
  })

  const currentModel = filteredModels.find(
    (model) => model.id === languageModel.model,
  )

  async function handleSubmitAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!session) {
      return setAuthDialog(true)
    }

    // Generate UUID and navigate to project page with first message
    const projectId = uuidv4()

    // Build query params including image attachments and skills if present
    const queryParams = new URLSearchParams({
      firstMessage: chatInput,
      template: selectedTemplate,
      model: selectedModel,
    })

    // Add skills to query params if any are selected
    if (selectedSkills.length > 0) {
      const skillIds = selectedSkills.map(skill => skill.id)
      queryParams.set('skills', JSON.stringify(skillIds))
    }

    // Upload files and get URLs if any files exist
    if (files.length > 0) {
      try {
        setIsUploadingImages(true)
        console.log('[ExaAppClient] Uploading', files.length, 'images before navigation...')

        // Upload each image to Vercel Blob
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }

          return await response.json() as ImageAttachment
        })

        const uploadedAttachments = await Promise.all(uploadPromises)
        const imageUrls = uploadedAttachments.map(a => a.url)
        queryParams.set('imageUrls', JSON.stringify(imageUrls))
        console.log('[ExaAppClient] Uploaded image URLs:', imageUrls)
      } catch (error) {
        console.error('[ExaAppClient] Error uploading images:', error)
        toast({
          title: 'Upload Failed',
          description: 'Failed to upload one or more images. Please try again.',
          variant: 'destructive',
        })
        setIsUploadingImages(false)
        return
      } finally {
        setIsUploadingImages(false)
      }
    }

    router.push(`/p/${projectId}?${queryParams.toString()}`)

    posthog.capture('exa_people_chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
      hasImages: files.length > 0,
      imageCount: files.length,
      hasSkills: selectedSkills.length > 0,
      skillCount: selectedSkills.length,
    })

    // Clear files and skills after navigation
    setFiles([])
    setSelectedSkills([])
  }

  function handleSaveInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setChatInput(e.target.value)
  }

  function handleFileChange(change: SetStateAction<File[]>) {
    setFiles(change)
  }

  return (
    <>
      <AuthDialog
        open={isAuthDialogOpen}
        setOpen={setAuthDialog}
        callbackURL={typeof window !== 'undefined' ? window.location.href : undefined}
      />
      <ChatInput
        hideHoverModeToggle
        retry={() => {}}
        isErrored={false}
        errorMessage=""
        isLoading={isUploadingImages}
        isRateLimited={false}
        stop={() => {}}
        input={chatInput}
        handleInputChange={handleSaveInputChange}
        handleSubmit={handleSubmitAuth}
        isMultiModal={currentModel?.multiModal || false}
        files={files}
        handleFileChange={handleFileChange}
        disabled={isUploadingImages}
        isAuthenticated={!!session}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onSkillsChange={setSelectedSkills}
        suggestionTip="Exa People Search"
      />
    </>
  )
}
