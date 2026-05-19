export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  process.on('unhandledRejection', (reason: any) => {
    console.error('[unhandledRejection] name:', reason?.name)
    console.error('[unhandledRejection] message:', reason?.message)
    console.error('[unhandledRejection] stack:', reason?.stack)
    console.error('[unhandledRejection] cause:', reason?.cause)
    console.error('[unhandledRejection] keys:', Object.keys(reason || {}))
    try { console.error('[unhandledRejection] full:', JSON.stringify(reason, Object.getOwnPropertyNames(reason || {}), 2)) } catch {}
  })
  process.on('uncaughtException', (err: any) => {
    console.error('[uncaughtException]', err?.stack || err)
  })
}
