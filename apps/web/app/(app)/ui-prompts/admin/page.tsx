import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth/index"
import { AdminPanel } from "@/components/ui-prompts/admin-panel"

const ADMIN_EMAIL = "rodrigofigueroa.name@gmail.com"

export const dynamic = "force-dynamic"

export default async function UiPromptsAdminPage() {
  const session = await getServerSession()

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect("/ui-prompts")
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AdminPanel />
      </div>
    </main>
  )
}
