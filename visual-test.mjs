/**
 * Visual smoke test for the Flutter Vibe Code IDE.
 *
 * Walks through public routes, captures screenshots, and dumps key DOM signals
 * so we can confirm that the new ProviderSelector / BYOK panel are wired in
 * even without an authenticated session (we still inspect what's compiled in).
 */

import { chromium } from '/var/www/flutter-vibe-code/ide/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT = '/tmp/visual-test'
mkdirSync(OUT, { recursive: true })

const BASE = process.env.BASE_URL || 'https://fluttervibecode.dpdns.org'

const targets = [
  { name: '01-landing', path: '/', viewport: { width: 1440, height: 900 } },
  { name: '02-landing-mobile', path: '/', viewport: { width: 390, height: 844 } },
  { name: '03-admin', path: '/admin', viewport: { width: 1440, height: 900 } },
  { name: '04-space', path: '/space', viewport: { width: 1440, height: 900 } },
  { name: '05-pricing', path: '/subscription', viewport: { width: 1440, height: 900 } },
  { name: '06-policy', path: '/policy', viewport: { width: 1440, height: 900 } },
  { name: '07-support', path: '/support', viewport: { width: 1440, height: 900 } },
  // Try a fake project id — should reach the auth wall or 404 with the new UI shell visible.
  { name: '08-project-fake', path: '/p/visual-test', viewport: { width: 1440, height: 900 } },
]

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const summary = []
for (const t of targets) {
  const ctx = await browser.newContext({ viewport: t.viewport })
  const page = await ctx.newPage()
  const consoleMessages = []
  page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleMessages.push(`[pageerror] ${err.message}`))

  const url = `${BASE}${t.path}`
  let status = null
  let title = null
  let bodyText = null
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    status = resp ? resp.status() : null
    title = await page.title()
    bodyText = (await page.textContent('body'))?.replace(/\s+/g, ' ').slice(0, 280) || null
    await page.waitForTimeout(800) // settle animations
    await page.screenshot({ path: `${OUT}/${t.name}.png`, fullPage: false })
  } catch (e) {
    consoleMessages.push(`[goto] ${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`)
    try {
      await page.screenshot({ path: `${OUT}/${t.name}-error.png`, fullPage: false })
    } catch {}
  }

  // DOM signals: look for any leftover RN/Expo strings, and for our new tokens.
  const signals = await page.evaluate(() => {
    const html = document.documentElement.outerHTML.toLowerCase()
    return {
      mentionsRN: /react.?native|expo router|@expo\//.test(html),
      mentionsFlutter: /flutter|riverpod|go_router|dart|pubspec/.test(html),
      mentionsProviderTokens: /vibe_provider_id|byok_keys|deepseek|minimax|openrouter|kimi/.test(html),
      hasButtons: document.querySelectorAll('button').length,
      hasForms: document.querySelectorAll('form').length,
    }
  }).catch(() => null)

  summary.push({
    name: t.name,
    url,
    status,
    title,
    viewport: `${t.viewport.width}x${t.viewport.height}`,
    bodyExcerpt: bodyText,
    signals,
    consoleErrors: consoleMessages.filter((m) => m.startsWith('[error') || m.startsWith('[pageerror')),
  })

  await ctx.close()
}

await browser.close()

writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2))
console.log('---SUMMARY---')
for (const r of summary) {
  console.log(`${r.name.padEnd(22)} ${String(r.status ?? '???').padEnd(4)} ${r.viewport.padEnd(10)} ${r.title ?? ''}`)
  if (r.consoleErrors.length) {
    for (const e of r.consoleErrors.slice(0, 3)) console.log('  err:', e.slice(0, 180))
  }
}
console.log('---SIGNALS---')
for (const r of summary) {
  if (!r.signals) continue
  console.log(`${r.name.padEnd(22)} RN=${r.signals.mentionsRN} Flutter=${r.signals.mentionsFlutter} Provider=${r.signals.mentionsProviderTokens} btns=${r.signals.hasButtons}`)
}
console.log(`screenshots in ${OUT}`)
