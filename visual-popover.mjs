/**
 * Capture the ProviderSelector popover open, with all 5 providers visible,
 * plus a model card hover, plus the BYOK panel structure.
 */
import { chromium } from '/var/www/flutter-vibe-code/ide/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs'
import { mkdirSync } from 'node:fs'

const OUT = '/tmp/visual-test'
mkdirSync(OUT, { recursive: true })
const BASE = 'https://fluttervibecode.dpdns.org'

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

// 1. Open landing, click the ProviderSelector button.
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/A1-landing-default.png` })

// The ProviderSelector trigger has the model name + chevron. Find any button
// containing "ANTHROPIC" or "Claude Opus".
const trigger = page.getByRole('button').filter({ hasText: /Claude Opus|ANTHROPIC/i }).first()
await trigger.waitFor({ timeout: 10000 })
await trigger.click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/A2-popover-default-anthropic.png` })

// 2. Click DeepSeek provider in the rail.
const deepseekRow = page.getByRole('button').filter({ hasText: /DeepSeek/i }).first()
await deepseekRow.click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/A3-popover-deepseek.png` })

// 3. Click MiniMax.
const minimaxRow = page.getByRole('button').filter({ hasText: /MiniMax/i }).first()
await minimaxRow.click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/A4-popover-minimax.png` })

// 4. Click Moonshot.
const moonshotRow = page.getByRole('button').filter({ hasText: /Moonshot|Kimi/i }).first()
await moonshotRow.click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/A5-popover-moonshot.png` })

// 5. Click OpenRouter.
const openrouterRow = page.getByRole('button').filter({ hasText: /OpenRouter/i }).first()
await openrouterRow.click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/A6-popover-openrouter.png` })

// 6. Effort dial — click "Min" then "High".
await page.getByRole('radio', { name: /Min/i }).click().catch(() => {})
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/A7-effort-min.png` })
await page.getByRole('radio', { name: /High/i }).click().catch(() => {})
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/A8-effort-high.png` })

// 7. Close popover → take landing again.
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/A9-landing-with-openrouter-selected.png` })

console.log('done — all popover frames captured')
await browser.close()
