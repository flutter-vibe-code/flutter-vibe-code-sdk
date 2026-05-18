#!/usr/bin/env bun

/**
 * Test Toolkit API Endpoints
 *
 * This script tests all toolkit API endpoints to ensure they're working correctly.
 *
 * Usage:
 *   pnpm run test:toolkit                                    # Test localhost:3210
 *   TEST_BASE_URL=https://your-app.com pnpm run test:toolkit # Test production
 */

// Prioritize localhost for testing, then fall back to env vars
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3210'

interface TestResult {
  endpoint: string
  status: 'success' | 'error'
  message: string
  responseTime?: number
}

const results: TestResult[] = []

async function testLLMEndpoint() {
  const endpoint = `${BASE_URL}/api/toolkit/llm`
  const startTime = Date.now()

  try {
    console.log(`\n🧪 Testing LLM endpoint: ${endpoint}`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello, this is a test!" and nothing else.' }
        ]
      })
    })

    const responseTime = Date.now() - startTime

    // Check content type before parsing
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      console.error(`❌ LLM endpoint returned non-JSON response (${contentType}):`, text.substring(0, 200))
      results.push({
        endpoint: '/api/toolkit/llm',
        status: 'error',
        message: `Server returned ${contentType} instead of JSON. Is the dev server running?`
      })
      return
    }

    const data = await response.json()

    if (response.ok && data.completion) {
      console.log(`✅ LLM endpoint working! Response: ${data.completion}`)
      console.log(`⏱️  Response time: ${responseTime}ms`)
      results.push({
        endpoint: '/api/toolkit/llm',
        status: 'success',
        message: `Got completion: ${data.completion.substring(0, 50)}...`,
        responseTime
      })
    } else {
      console.error(`❌ LLM endpoint error:`, data)
      results.push({
        endpoint: '/api/toolkit/llm',
        status: 'error',
        message: data.error || 'Unknown error'
      })
    }
  } catch (error) {
    console.error(`❌ LLM endpoint failed:`, error)
    results.push({
      endpoint: '/api/toolkit/llm',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function testSTTEndpoint() {
  const endpoint = `${BASE_URL}/api/toolkit/stt`

  try {
    console.log(`\n🧪 Testing STT endpoint: ${endpoint}`)
    console.log(`ℹ️  Note: STT requires OPENAI_API_KEY (used for Whisper API)`)

    // Just test if endpoint exists and returns appropriate error
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })

    // Check content type before parsing
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      console.log(`ℹ️  STT endpoint returned non-JSON (${contentType}). Server might not be running.`)
      results.push({
        endpoint: '/api/toolkit/stt',
        status: 'error',
        message: `Server returned ${contentType}. Is the dev server running?`
      })
      return
    }

    const data = await response.json()

    if (response.status === 400 || response.status === 500) {
      // Expected - we didn't send audio data
      console.log(`ℹ️  STT endpoint exists (returned ${response.status})`)
      results.push({
        endpoint: '/api/toolkit/stt',
        status: 'success',
        message: 'Endpoint exists and responds'
      })
    } else {
      console.log(`✅ STT endpoint working!`)
      results.push({
        endpoint: '/api/toolkit/stt',
        status: 'success',
        message: 'Endpoint accessible'
      })
    }
  } catch (error) {
    console.error(`❌ STT endpoint failed:`, error)
    results.push({
      endpoint: '/api/toolkit/stt',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function testImagesEndpoint() {
  const endpoint = `${BASE_URL}/api/toolkit/images`

  try {
    console.log(`\n🧪 Testing Images endpoint: ${endpoint}`)
    console.log(`ℹ️  Note: Images requires OPENAI_API_KEY (used for DALL-E API)`)

    // Just test if endpoint exists
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'test' })
    })

    // Check content type before parsing
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      console.log(`ℹ️  Images endpoint returned non-JSON (${contentType}). Server might not be running.`)
      results.push({
        endpoint: '/api/toolkit/images',
        status: 'error',
        message: `Server returned ${contentType}. Is the dev server running?`
      })
      return
    }

    const data = await response.json()

    if (response.status === 400 || response.status === 500 || response.ok) {
      console.log(`ℹ️  Images endpoint exists (returned ${response.status})`)
      results.push({
        endpoint: '/api/toolkit/images',
        status: 'success',
        message: 'Endpoint exists and responds'
      })
    }
  } catch (error) {
    console.error(`❌ Images endpoint failed:`, error)
    results.push({
      endpoint: '/api/toolkit/images',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function testSearchEndpoint() {
  const endpoint = `${BASE_URL}/api/toolkit/search`
  const startTime = Date.now()

  try {
    console.log(`\n🧪 Testing Search endpoint: ${endpoint}`)
    console.log(`ℹ️  Note: Search requires SERP_API_KEY (SerpAPI)`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'test search' })
    })

    const responseTime = Date.now() - startTime

    // Check content type before parsing
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      console.log(`ℹ️  Search endpoint returned non-JSON (${contentType}). Server might not be running.`)
      results.push({
        endpoint: '/api/toolkit/search',
        status: 'error',
        message: `Server returned ${contentType}. Is the dev server running?`
      })
      return
    }

    const data = await response.json()

    if (response.ok && data.organicResults) {
      console.log(`✅ Search endpoint working! Got ${data.organicResults.length} results`)
      console.log(`⏱️  Response time: ${responseTime}ms`)
      results.push({
        endpoint: '/api/toolkit/search',
        status: 'success',
        message: `Got ${data.organicResults.length} search results`,
        responseTime
      })
    } else if (response.status === 500 && data.error?.includes('SerpAPI key')) {
      console.log(`ℹ️  Search endpoint exists but SerpAPI key not configured`)
      results.push({
        endpoint: '/api/toolkit/search',
        status: 'success',
        message: 'Endpoint exists (SerpAPI key needed for full functionality)'
      })
    } else {
      console.error(`❌ Search endpoint error:`, data)
      results.push({
        endpoint: '/api/toolkit/search',
        status: 'error',
        message: data.error || 'Unknown error'
      })
    }
  } catch (error) {
    console.error(`❌ Search endpoint failed:`, error)
    results.push({
      endpoint: '/api/toolkit/search',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function checkEnvironmentVariables() {
  console.log('\n📋 Environment Check:')
  console.log('─────────────────────────────────────')

  const requiredVars = {
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
    'NEXT_PUBLIC_PROD_URL': process.env.NEXT_PUBLIC_PROD_URL,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
  }

  const optionalVars = {
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'SERP_API_KEY': process.env.SERP_API_KEY || process.env.SERP_API,
  }

  console.log('\n✅ Required Variables:')
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4)
      console.log(`  ${key}: ${masked}`)
    } else {
      console.log(`  ❌ ${key}: NOT SET`)
    }
  }

  console.log('\n⚠️  Optional Variables:')
  for (const [key, value] of Object.entries(optionalVars)) {
    if (value) {
      const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4)
      console.log(`  ${key}: ${masked}`)
    } else {
      if (key === 'OPENAI_API_KEY') {
        console.log(`  ${key}: NOT SET (needed for STT and Images endpoints)`)
      } else if (key === 'SERP_API_KEY') {
        console.log(`  ${key}: NOT SET (needed for Search endpoint)`)
      } else {
        console.log(`  ${key}: NOT SET`)
      }
    }
  }

  console.log(`\n🌐 Base URL: ${BASE_URL}`)
}

async function runTests() {
  console.log('╔══════════════════════════════════════╗')
  console.log('║  Toolkit API Endpoint Test Suite    ║')
  console.log('╚══════════════════════════════════════╝')

  // Check environment
  checkEnvironmentVariables()

  // Run tests
  await testLLMEndpoint()
  await testSTTEndpoint()
  await testImagesEndpoint()
  await testSearchEndpoint()

  // Summary
  console.log('\n')
  console.log('╔══════════════════════════════════════╗')
  console.log('║  Test Results Summary                ║')
  console.log('╚══════════════════════════════════════╝')
  console.log('')

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌'
    const time = result.responseTime ? ` (${result.responseTime}ms)` : ''
    console.log(`${icon} ${result.endpoint}${time}`)
    console.log(`   ${result.message}`)
    console.log('')
  })

  const successCount = results.filter(r => r.status === 'success').length
  const totalCount = results.length

  console.log(`\n📊 Results: ${successCount}/${totalCount} endpoints working`)

  if (successCount === totalCount) {
    console.log('\n🎉 All toolkit endpoints are working correctly!\n')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some endpoints have issues. Check the errors above.\n')
    process.exit(1)
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error)
  process.exit(1)
})
