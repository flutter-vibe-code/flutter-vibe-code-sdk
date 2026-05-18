/**
 * Login as silvio.sotelo@hotmail.com, hit "/", capture full DOM of <header>/<nav>
 * to identify what's rendering as a white card behind the floating glass nav.
 */
import { chromium } from '/var/www/flutter-vibe-code/ide/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'

mkdirSync('/tmp/visual-logged', { recursive: true })
const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

// 1. Sign in
await page.goto('https://fluttervibecode.dpdns.org/sign-in', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(800)
await page.fill('input[type="email"]', 'silvio.sotelo@hotmail.com')
await page.fill('input[type="password"]', 'Flutter2026')
await page.screenshot({ path: '/tmp/visual-logged/A1-form-filled.png' })
await Promise.all([
  page.waitForLoadState('domcontentloaded', { timeout: 25000 }).catch(() => null),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(3000)

console.log('after sign-in URL:', page.url())
await page.screenshot({ path: '/tmp/visual-logged/A2-after-signin.png' })

// 2. Go to home (logged in)
await page.goto('https://fluttervibecode.dpdns.org/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(2000)
await page.screenshot({ path: '/tmp/visual-logged/A3-home-logged.png' })

// 3. Inspect what's wrapping the nav
const navInfo = await page.evaluate(() => {
  const nav = document.querySelector('nav')
  if (!nav) return { error: 'no nav' }
  // Walk up the tree, capture each ancestor's tag + computed bg + className
  const chain = []
  let el = nav
  for (let i = 0; i < 10 && el && el !== document.body; i++) {
    const cs = window.getComputedStyle(el)
    chain.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className && typeof el.className === 'string' ? el.className.slice(0, 200) : ''),
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage.slice(0, 80),
      backdropFilter: cs.backdropFilter,
    })
    el = el.parentElement
  }
  // Also capture the rendered nav class
  return {
    navClass: nav.className.slice(0, 400),
    navBg: window.getComputedStyle(nav).backgroundColor,
    navBackdrop: window.getComputedStyle(nav).backdropFilter,
    chain,
  }
})
writeFileSync('/tmp/visual-logged/nav-info.json', JSON.stringify(navInfo, null, 2))

console.log('NAV INFO ↓')
console.log(JSON.stringify(navInfo, null, 2))

await browser.close()
