import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'

// Inngest functions disabled to prevent potential issues
// All background jobs should be handled differently
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [],
  signingKey: process.env.INNGEST_SIGNING_KEY,
})
