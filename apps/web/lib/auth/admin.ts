/**
 * Admin email helpers. ADMIN_EMAIL is a comma-separated list (env), so all
 * admin checks must split-and-trim before comparing. Without this every
 * route that did `email !== process.env.ADMIN_EMAIL` is silently broken.
 */

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL || ''
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdmin(email?: string | null): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

export function getAdminEmailList(): string[] {
  return getAdminEmails()
}
