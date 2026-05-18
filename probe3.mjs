
console.log("DATABASE_URL=", process.env.DATABASE_URL?.slice(0, 60))
const mod = await import("./apps/web/lib/auth/config.ts")
const auth = mod.auth
const req = new Request("http://localhost:3100/api/auth/sign-up/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "probe@vibe.test", password: "vibecode123", name: "Probe" })
})
try {
  const res = await auth.handler(req)
  console.log("status:", res.status)
  console.log("body:", await res.text())
} catch (e) {
  console.error("THROWN:", e?.message)
  console.error(e?.stack?.slice(0,3000))
}
process.exit(0)
