import { NextResponse } from "next/server"

// Self-host stub: Better Auth polar plugin removed, so /api/auth/customer/state
// would otherwise 404. Return an empty state so the payments client falls
// through to its fallback silently.
export async function GET() {
  return NextResponse.json({
    data: {
      activeMeters: [],
      activeSubscriptions: [],
    },
  })
}
