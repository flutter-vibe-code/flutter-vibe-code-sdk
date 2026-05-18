import { NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders, handleCorsOptions } from '@/lib/cors'

export const maxDuration = 120

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio')

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid request: audio file is required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    // Check file size (OpenAI has 25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const language = formData.get('language')

    // Create form data for OpenAI Whisper API
    const openAIFormData = new FormData()
    openAIFormData.append('file', audioFile)
    openAIFormData.append('model', 'whisper-1')
    openAIFormData.append('response_format', 'json')

    if (language && typeof language === 'string') {
      openAIFormData.append('language', language)
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openAIFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Toolkit STT] OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: response.status, headers: getCorsHeaders(request) }
      )
    }

    const data = await response.json()

    return NextResponse.json(
      {
        text: data.text,
        language: data.language || 'en',
      },
      { headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    console.error('[Toolkit STT] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}
