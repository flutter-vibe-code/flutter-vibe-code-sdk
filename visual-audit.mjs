/**
 * Full UI/UX audit across 3 breakpoints x N routes.
 * Captures screenshots into /tmp/visual-audit/{breakpoint}/{route}.png
 * Plus a JSON summary with DOM signals (layout breaks, overflow, console errors).
 */
import { chromium } from '/var/www/flutter-vibe-code/ide/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = '/tmp/visual-audit'
mkdirSync(OUT, { recursive: true })
const BASE = 'https://fluttervibecode.dpdns.org'

const breakpoints = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

const routes = [
  { name: '01-landing', path: '/' },
  { name: '02-sign-in', path: '/sign-in' },
  { name: '03-sign-up', path: '/sign-up' },
  { name: '04-policy', path: '/policy' },
  { name: '05-terms', path: '/terms-of-service' },
  { name: '06-support', path: '/support' },
  { name: '07-project', path: '/p/audit-test' },
  { name: '08-blog', path: '/blog' },
  { name: '09-pricing', path: '/subscription' },
]

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const summary = []
for (const bp of breakpoints) {
  mkdirSync(`${OUT}/${bp.name}`, { recursive: true })
  const ctx = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
    deviceScaleFactor: bp.name === 'mobile' ? 2 : 1,
  })
  const page = await ctx.newPage()
  for (const r of routes) {
    const consoleErrors = []
    page.removeAllListeners('console')
    page.removeAllListeners('pageerror')
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)) })
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 200)}`))
    let status = null
    let signals = null
    try {
      const resp = await page.goto(`${BASE}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 25000 })
      status = resp ? resp.status() : null
      await page.waitForTimeout(900)
      signals = await page.evaluate((bp) => {
        const html = document.documentElement
        const body = document.body
        // Horizontal overflow detection
        const overflowX = body.scrollWidth > window.innerWidth + 1
        // Find elements that overflow viewport
        const all = Array.from(document.querySelectorAll('body *'))
        const wide = all.filter((el) => el.scrollWidth > window.innerWidth + 1)
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${(el.className && typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '') || ''} (w=${el.scrollWidth})`)
        // Touch target sizing on mobile
        const buttons = document.querySelectorAll('button, [role="button"], a')
        let smallTouchTargets = 0
        if (bp.width <= 480) {
          buttons.forEach((b) => {
            const r = b.getBoundingClientRect()
            if (r.width > 0 && r.height > 0 && (r.width < 36 || r.height < 36)) smallTouchTargets++
          })
        }
        return {
          docHeight: html.scrollHeight,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          overflowX,
          wideElements: wide,
          buttons: buttons.length,
          smallTouchTargets,
          title: document.title,
          h1: document.querySelector('h1')?.innerText?.slice(0, 80) || null,
        }
      }, bp)
      await page.screenshot({ path: `${OUT}/${bp.name}/${r.name}.png`, fullPage: false })
    } catch (e) {
      consoleErrors.push(`goto: ${(e instanceof Error ? e.message : String(e)).slice(0, 150)}`)
      try { await page.screenshot({ path: `${OUT}/${bp.name}/${r.name}-error.png` }) } catch {}
    }
    summary.push({
      breakpoint: bp.name,
      viewport: `${bp.width}x${bp.height}`,
      route: r.path,
      name: r.name,
      status,
      signals,
      consoleErrorCount: consoleErrors.length,
      consoleErrors: consoleErrors.slice(0, 4),
    })
  }
  await ctx.close()
}
await browser.close()

writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2))

// Print compact table
console.log('---AUDIT---')
console.log('breakpoint  route                   status  overflow  buttons  smallTouch  errors  title')
for (const r of summary) {
  const s = r.signals
  const ovr = s?.overflowX ? 'YES' : 'no'
  console.log(
    `${r.breakpoint.padEnd(10)}  ${r.route.padEnd(22)}  ${String(r.status ?? '?').padEnd(6)}  ${ovr.padEnd(8)}  ${String(s?.buttons ?? '?').padEnd(7)}  ${String(s?.smallTouchTargets ?? '-').padEnd(10)}  ${String(r.consoleErrorCount).padEnd(6)}  ${(s?.title ?? '').slice(0, 30)}`,
  )
  if (s?.overflowX && s?.wideElements?.length) {
    console.log(`            ↳ wide: ${s.wideElements.join(', ').slice(0, 130)}`)
  }
  if (r.consoleErrors.length) {
    for (const e of r.consoleErrors.slice(0, 2)) console.log(`            ↳ err: ${e}`)
  }
}
console.log(`\n${OUT}/summary.json`)
