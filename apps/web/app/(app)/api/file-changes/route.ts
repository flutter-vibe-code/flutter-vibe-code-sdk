import { globalFileChangeStream } from '@/lib/file-change-stream'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId')
  
  if (!projectId) {
    return new Response('Project ID is required', { status: 400 })
  }

  console.log(`📡 [FileChanges SSE] New connection for project: ${projectId}`)

  const encoder = new TextEncoder()
  let connectionWriter: WritableStreamDefaultWriter<Uint8Array> | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialData = encoder.encode(`data: {"type":"connected","projectId":"${projectId}"}\n\n`)
      controller.enqueue(initialData)

      // Create a custom writer wrapper that works with the controller
      connectionWriter = {
        write: async (data: Uint8Array) => {
          try {
            controller.enqueue(data)
          } catch (error) {
            console.error(`❌ [FileChanges SSE] Error writing to stream:`, error)
            throw error
          }
        },
        close: async () => {
          try {
            controller.close()
          } catch (error) {
            console.error(`❌ [FileChanges SSE] Error closing stream:`, error)
          }
        },
        abort: async (reason?: any) => {
          try {
            controller.error(reason)
          } catch (error) {
            console.error(`❌ [FileChanges SSE] Error aborting stream:`, error)
          }
        }
      } as WritableStreamDefaultWriter<Uint8Array>
      
      // Add this connection to the file change stream
      globalFileChangeStream.addConnection(projectId, connectionWriter)

      console.log(`📡 [FileChanges SSE] Connection established for project ${projectId}`)
    },
    
    cancel() {
      console.log(`📡 [FileChanges SSE] Connection cancelled for project ${projectId}`)
      if (connectionWriter) {
        globalFileChangeStream.removeConnection(projectId, connectionWriter)
        connectionWriter = null
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}