import { NextRequest } from 'next/server'

export async function GET() {
  try {
    const loginRes = await fetch('http://localhost:20129/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'flutter2026' }),
    })
    const loginData = await loginRes.json()
    const cookies = loginRes.headers.get('set-cookie') || ''
    
    if (!loginData.success) return fallback()

    const providersRes = await fetch('http://localhost:20129/api/providers', {
      headers: { Cookie: cookies },
    })
    const data = await providersRes.json()
    const connections = data.connections || []

    const nameMap: Record<string, string> = {
      claude: 'Claude Code (OAuth)',
      antigravity: 'Antigravity (OAuth)',
      'perplexity-web': 'Perplexity Web',
      elevenlabs: 'ElevenLabs',
    }

    const urlMap: Record<string, string> = {
      claude: 'Anthropic via OAuth',
      antigravity: 'Gemini/Claude via OAuth',
      'perplexity-web': 'Perplexity Web',
      elevenlabs: 'ElevenLabs Audio',
      'opencode-go': 'https://opencode.ai/zen/go/v1',
      deepseek: 'https://api.deepseek.com/v1',
      minimax: 'https://api.minimax.chat/v1',
      anthropic: 'https://api.anthropic.com',
    }

    const providers = connections
      .filter((c: any) => c.isActive !== false)
      .map((c: any) => ({
        name: nameMap[c.provider] || c.provider,
        key: c.id,
        maskedKey: c.authType === 'oauth' ? 'OAuth' : c.authType === 'cookie' ? 'Cookie' : 'API Key',
        baseURL: urlMap[c.provider] || c.provider,
        configured: true,
        status: c.testStatus === 'active' ? 'ok' : (c.testStatus || 'ok'),
        authType: c.authType,
        omniId: c.id,
      }))

    return Response.json({ providers })
  } catch (err: any) {
    console.error('[OmniRoute] Fetch error:', err.message)
    return fallback()
  }
}

function fallback() {
  const keys = [
    { key: 'ANTHROPIC_API_KEY', label: 'Anthropic' },
    { key: 'OPENCODE_API_KEY', label: 'OpenCode GO' },
    { key: 'MINIMAX_API_KEY', label: 'MiniMax' },
    { key: 'DEEPSEEK_API_KEY', label: 'DeepSeek' },
  ]
  const providers = keys.map(p => {
    const k = process.env[p.key] || ''
    return {
      name: p.label,
      key: p.key,
      maskedKey: k ? k.substring(0, 8) + '...' : '-',
      baseURL: p.label === 'Anthropic' ? 'https://api.anthropic.com' : p.label,
      configured: !!k,
      status: 'unknown',
      authType: 'apikey',
    }
  })
  return Response.json({ providers })
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json()
  const fs = await import('fs/promises')
  const path = await import('path')
  const envPath = path.join(process.cwd(), '.env.local')
  let env = await fs.readFile(envPath, 'utf-8')
  const regex = new RegExp('^' + key + '=.*$', 'm')
  if (env.match(regex)) env = env.replace(regex, key + '=' + value)
  else env += '\n' + key + '=' + value + '\n'
  await fs.writeFile(envPath, env)
  return Response.json({ success: true })
}

