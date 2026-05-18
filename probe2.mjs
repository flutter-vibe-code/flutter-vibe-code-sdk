
import { config } from "dotenv"
config({ path: "./.env.local" })
console.log("DATABASE_URL=", process.env.DATABASE_URL?.slice(0, 50))
console.log("E2B_API_KEY=", process.env.E2B_API_KEY?.slice(0, 10))

const mod = await import("./apps/web/lib/auth/config.ts")
const auth = mod.auth

const req = new Request("http://localhost:3100/api/auth/sign-up/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test@vibe.test", password: "vibecode123", name: "Test" })
})

try {
  const res = await auth.handler(req)
  console.log("status:", res.status)
  console.log("body:", await res.text())
} catch (e) {
  console.error("THROWN:", e?.message)
  console.error(e?.stack)
}
process.exit(0)
