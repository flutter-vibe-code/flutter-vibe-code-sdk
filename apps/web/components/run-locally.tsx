'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function RunLocally() {
  const [copied, setCopied] = useState(false)
  const command = 'npx create-rnvibecode my-rn-vibe-code-app'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="w-full bg-background py-20 pt-[5px] md:py-32 md:pt-0 md:-top-[240px] md:relative">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Headline */}
        <div className="text-center mb-8 md:mb-12 max-w-4xl m-auto">
          <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 leading-tight">
            CLI that installs a complete Expo vibe code codebase
            <br />
            <span className="font-bold">with our powerful Claude Code system prompt</span>
          </h3>
          <p className="text-muted-foreground text-md md:text-lg max-w-2xl mx-auto">
            Get the full Flutter Vibe Code starter with 67+ packages and a pre-configured CLAUDE.md to start supercharged building vibe coded apps on your computer.
          </p>
        </div>

        {/* Command Card */}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleCopy}
            className="w-full group relative bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between gap-4">
              <code className="text-green-400 font-mono text-sm md:text-base lg:text-lg break-all text-left">
                <span className="text-zinc-500 select-none">$ </span>
                {command}
              </code>
              <div className="flex-shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  )
}
