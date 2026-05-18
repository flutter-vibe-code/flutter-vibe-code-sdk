import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "UI Prompt Gallery | Flutter Vibe Code",
  description:
    "Curated collection of AI prompts that generate beautiful Flutter UIs. Browse, search, and remix designs instantly.",
}

export default function UiPromptsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
