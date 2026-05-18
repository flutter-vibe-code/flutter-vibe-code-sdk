import { NextRequest, NextResponse } from 'next/server'

// Set max duration to 2 minutes for transcription
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Check file size (OpenAI has 25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      )
    }

    const openAIKey = process.env.OPENAI_API_KEY
    if (!openAIKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('[Transcribe] Processing audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    })

    // Create form data for OpenAI Whisper API
    const openAIFormData = new FormData()
    openAIFormData.append('file', audioFile)
    openAIFormData.append('model', 'whisper-1')
    openAIFormData.append('language', 'en') // You can make this configurable
    openAIFormData.append('response_format', 'json')

    // Call OpenAI Whisper API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000) // 90 second timeout

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: openAIFormData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        console.error('[Transcribe] OpenAI API error:', error)
        return NextResponse.json(
          { error: 'Failed to transcribe audio. Please try with a shorter recording.' },
          { status: response.status }
        )
      }

      const data = await response.json()

      console.log('[Transcribe] Transcription successful:', {
        textLength: data.text?.length || 0,
        duration: data.duration,
      })

      return NextResponse.json({
        text: data.text,
        duration: data.duration,
        language: data.language,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        console.error('[Transcribe] Request timeout after 90 seconds')
        return NextResponse.json(
          { error: 'Transcription request timed out. Please try with a shorter audio recording.' },
          { status: 408 }
        )
      }

      throw fetchError
    }

  } catch (error: any) {
    console.error('[Transcribe] Transcription error:', error)

    // Provide more specific error messages
    if (error.code === 'ECONNRESET') {
      return NextResponse.json(
        { error: 'Connection was reset. Please try again with a shorter recording.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio. Please try again.' },
      { status: 500 }
    )
  }
}