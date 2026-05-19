"use client"

import { useState } from "react"
import { Lock, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/lib/auth/client"

interface PromptCodeBlockProps {
  prompt: string | null
  isAuthenticated: boolean
}

export function PromptCodeBlock({
  prompt,
  isAuthenticated,
}: PromptCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isAuthenticated || prompt === null) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">
          Sign in to view and copy the prompt
        </p>
        <Button
          onClick={() => signInWithGoogle()}
        >
          Login to get prompt
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">Prompt</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Prompt Content */}
      <pre className="p-4 text-sm text-foreground/80 whitespace-pre-wrap overflow-auto max-h-[225px] leading-relaxed">
        {prompt}
      </pre>
    </div>
  )
}
