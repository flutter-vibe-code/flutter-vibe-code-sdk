import { Inngest } from 'inngest'

export const inngest = new Inngest({ 
  id: 'e2b-fragments',
  eventKey: process.env.INNGEST_EVENT_KEY,
})