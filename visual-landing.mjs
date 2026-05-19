import { chromium } from "/var/www/flutter-vibe-code/ide/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs"
import { mkdirSync } from "node:fs"
mkdirSync("/tmp/visual-landing", { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox","--disable-setuid-sandbox"] })
for (const bp of [
  { name: "desktop", w: 1440, h: 900 },
  { name: "tablet", w: 768, h: 1024 },
  { name: "mobile", w: 390, h: 844 },
]) {
  const ctx = await browser.newContext({ viewport: { width: bp.w, height: bp.h }, deviceScaleFactor: bp.name === "mobile" ? 2 : 1 })
  const page = await ctx.newPage()
  await page.goto("https://fluttervibecode.dpdns.org/", { waitUntil: "domcontentloaded", timeout: 25000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `/tmp/visual-landing/${bp.name}-top.png` })
  // Full page (mostly): scroll & take 2nd shot mid-page
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.2, behavior: "instant" }))
  await page.waitForTimeout(700)
  await page.screenshot({ path: `/tmp/visual-landing/${bp.name}-features.png` })
  await ctx.close()
}
await browser.close()
console.log("done")
