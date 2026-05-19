import { NextRequest } from 'next/server'

const OCGO = 'http://localhost:3456'

async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api/omniroute-proxy', '')
  const url = OCGO + path + req.nextUrl.search
  try {
    const headers: Record<string,string> = {}
    req.headers.forEach((v,k) => { if(!['host','connection','transfer-encoding'].includes(k.toLowerCase())) headers[k]=v })
    const body = req.body ? await req.text() : undefined
    const res = await fetch(url, { method: req.method, headers, body })
    const resBody = await res.text()
    const resHeaders: Record<string,string> = { 'access-control-allow-origin':'*', 'access-control-allow-methods':'*', 'access-control-allow-headers':'*' }
    for(const [k,v] of res.headers) { if(['set-cookie','content-type'].includes(k.toLowerCase())) resHeaders[k]=v }
    return new Response(resBody, { status: res.status, headers: resHeaders })
  } catch(err: any) {
    return new Response(JSON.stringify({error:'Proxy error'}), { status:502, headers:{'content-type':'application/json'} })
  }
}
export async function GET(r: NextRequest) { return proxy(r) }
export async function POST(r: NextRequest) { return proxy(r) }
export async function PUT(r: NextRequest) { return proxy(r) }
export async function DELETE(r: NextRequest) { return proxy(r) }
export async function OPTIONS(r: NextRequest) {
  return new Response(null, { status:204, headers:{'access-control-allow-origin':'*','access-control-allow-methods':'*','access-control-allow-headers':'*'} })
}

