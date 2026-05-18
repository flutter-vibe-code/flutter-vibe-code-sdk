import { flag } from 'flags/next'
import { vercelAdapter } from '@flags-sdk/vercel'

export const opencodeEnabled = flag<boolean>({
  key: 'opencode',
  defaultValue: false,
  ...(process.env.FLAGS
    ? { adapter: vercelAdapter() }
    : { decide: () => false }),
})

export const tunnelMode = flag<string>({
  key: 'tunnelMode',
  defaultValue: 'e2b-public',
  ...(process.env.FLAGS
    ? { adapter: vercelAdapter() }
    : { decide: () => 'e2b-public' }),
})

export const templateFlag = flag<string>({
  key: 'template',
  defaultValue: 'flutter',
  ...(process.env.FLAGS
    ? { adapter: vercelAdapter() }
    : { decide: () => 'flutter' }),
})
