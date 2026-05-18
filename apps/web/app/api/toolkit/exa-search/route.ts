import { NextRequest, NextResponse } from 'next/server'
import Exa from 'exa-js'
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

    // Validate request body
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: query string is required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const { query, numResults = 10 } = body

    // Validate numResults
    if (typeof numResults !== 'number' || numResults < 1 || numResults > 100) {
      return NextResponse.json(
        { error: 'Invalid request: numResults must be between 1 and 100' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    // Check API key
    const apiKey = process.env.EXA_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Exa API key not configured' },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    // Initialize Exa client
    const exa = new Exa(apiKey)

    // Perform search with people category
    // Using type="auto" and category="people" as specified
    // Note: TypeScript types don't include "people" yet, but the API supports it
    const response = await exa.search(query, {
      category: 'people' as any,
      type: 'auto' as any,
      numResults,
    })

    return NextResponse.json(
      {
        results: response.results,
        requestId: response.requestId,
      },
      {
        headers: getCorsHeaders(request)
      }
    )
  } catch (error: any) {
    console.error('[Exa Search] Error:', error)

    // Provide more specific error messages
    const errorMessage = error?.message || 'Search failed'
    const statusCode = error?.status || 500

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode, headers: getCorsHeaders(request) }
    )
  }
}
