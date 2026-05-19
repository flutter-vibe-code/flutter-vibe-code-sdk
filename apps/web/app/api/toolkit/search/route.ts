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

    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: query string is required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const apiKey = process.env.SERP_API_KEY || process.env.SERP_API
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SerpAPI key not configured' },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    // Build SerpAPI request URL
    const params = new URLSearchParams({
      api_key: apiKey,
      q: body.query,
      gl: body.gl || 'us',  // Geographic location (default: US)
      hl: body.hl || 'en',  // Language (default: English)
      num: body.num || '10', // Number of results (default: 10)
    })

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('[Toolkit Search] SerpAPI error:', error)
      return NextResponse.json(
        { error: error?.error || 'Search failed' },
        { status: response.status, headers: getCorsHeaders(request) }
      )
    }

    const data = await response.json()

    // Return the full SerpAPI response with CORS headers
    return NextResponse.json(
      {
        searchMetadata: data.search_metadata,
        searchInformation: data.search_information,
        organicResults: data.organic_results || [],
        knowledgeGraph: data.knowledge_graph,
        relatedSearches: data.related_searches || [],
        localResults: data.local_results || [],
        shoppingResults: data.shopping_results || [],
      },
      { headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    console.error('[Toolkit Search] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}
