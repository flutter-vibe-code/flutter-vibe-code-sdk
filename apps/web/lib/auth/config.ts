import { db, user, session, account, verification, subscriptions, eq } from "@flutter-vibe-code/database"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { CONFIG } from "@flutter-vibe-code/config"
import { sendWelcomeEmail } from "@/lib/email"

function getNextResetDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

async function ensureUserSubscription(userId: string) {
  try {
    const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
    if (existing.length === 0) {
      await db.insert(subscriptions).values({ userId, currentPlan: "free", status: "inactive", messageLimit: CONFIG.FREE_PLAN_MESSAGE_LIMIT.toString(), resetDate: getNextResetDate(), metadata: { createdVia: "auto-ensure" } })
    }
    return true
  } catch (e) { console.error("[Auth]", e); return false }
}

export const auth = betterAuth({
  baseURL: process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_PROD_URL || "https://fluttervibecode.dpdns.org" : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3210"),
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification }, usePlural: false }),
  socialProviders: { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } },
  emailAndPassword: { enabled: true, autoSignIn: true, requireEmailVerification: false },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  databaseHooks: { user: { create: { after: async (user) => { await ensureUserSubscription(user.id); sendWelcomeEmail({ name: user.name, email: user.email }).catch(e => console.error("[Auth]", e)) } } } },
  plugins: [nextCookies()],
  trustedOrigins: ["https://fluttervibecode.dpdns.org", "http://localhost:3000", "http://localhost:3210", "capsule://", "exp://localhost:8081", "https://*.e2b.dev", "https://*.pages.dev", "https://*.capsulethis.app", "https://*.fluttervibecode.dpdns.org"].filter(Boolean) as string[],
})
