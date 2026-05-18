import { NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders, handleCorsOptions } from '@/lib/cors'

export const maxDuration = 60

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: prompt string is required' },
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

    const size = body.size || '1024x1024'

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: body.prompt,
        n: 1,
        size,
        response_format: 'b64_json',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Toolkit Images] OpenAI API error:', error)
      return NextResponse.json(
        { error: error?.error?.message || 'Image generation failed' },
        { status: response.status, headers: getCorsHeaders(request) }
      )
    }

    const data = await response.json()
    const imageData = data.data[0]

    return NextResponse.json(
      {
        image: {
          base64Data: imageData.b64_json,
          mimeType: 'image/png',
        },
        size,
      },
      { headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    console.error('[Toolkit Images] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}
