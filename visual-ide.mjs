import { chromium } from "/var/www/flutter-vibe-code/ide/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs"
import { mkdirSync } from "node:fs"
mkdirSync("/tmp/visual-ide", { recursive: true })
const b = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox","--disable-setuid-sandbox"] })
for (const bp of [
  { n: "desktop", w: 1440, h: 900 },
  { n: "mobile", w: 390, h: 844 },
]) {
  const ctx = await b.newContext({ viewport: { width: bp.w, height: bp.h }, deviceScaleFactor: bp.n === "mobile" ? 2 : 1 })
  const page = await ctx.newPage()
  await page.goto("https://fluttervibecode.dpdns.org/p/audit-ide", { waitUntil: "domcontentloaded", timeout: 25000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `/tmp/visual-ide/${bp.n}.png` })
  await ctx.close()
}
await b.close()
console.log("done")
