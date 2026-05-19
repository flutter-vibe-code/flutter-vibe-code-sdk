import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { isAdmin } from "@/lib/auth/admin"

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]

const IMAGE_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const VIDEO_MAX_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin access
    const adminEmail = process.env.ADMIN_EMAIL
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Validate file size based on type
    const isVideo = file.type.startsWith("video/")
    const maxSize = isVideo ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE
    const maxSizeLabel = isVideo ? "50MB" : "10MB"

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSizeLabel} limit` },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const blob = await put(
      `ui-prompts/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
        addRandomSuffix: true,
      }
    )

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[UI Prompts Upload] Error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
