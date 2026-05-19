
import { auth } from "./apps/web/lib/auth/config.js"

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
  console.error("THROWN:", e?.constructor?.name, e?.message)
  console.error(e?.stack)
}
process.exit(0)
