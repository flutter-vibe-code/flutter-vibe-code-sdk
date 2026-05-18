'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Bot,
  Code2,
  Database,
  FileCode,
  GitFork,
  Globe,
  History,
  Key,
  Layers,
  MessageSquare,
  MousePointer2,
  Package,
  Palette,
  Radio,
  ScrollText,
  Server,
  Settings,
  Sparkles,
  Terminal,
  Wallet,
  Zap,
} from 'lucide-react'

interface PackageInfo {
  id: string
  name: string
  shortDescription: string
  icon: React.ReactNode
  color: string
  docsPath: string
}

const packages: PackageInfo[] = [
  {
    id: 'agent',
    name: 'agent',
    shortDescription: 'Claude Agent SDK executor for running AI agents in isolated sandboxes',
    icon: <Bot className="w-5 h-5" />,
    color: 'purple',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/agent',
  },
  {
    id: 'sandbox',
    name: 'sandbox',
    shortDescription: 'Core sandbox environment with E2B integration and template management',
    icon: <Terminal className="w-5 h-5" />,
    color: 'green',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/sandbox',
  },
  {
    id: 'create-rnvibecode',
    name: 'create-rnvibecode',
    shortDescription: 'CLI to scaffold Expo projects with 67+ packages and Claude Code system prompt',
    icon: <Terminal className="w-5 h-5" />,
    color: 'emerald',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/starter-kit',
  },
  {
    id: 'prompt-engine',
    name: 'prompt-engine',
    shortDescription: 'AI prompt templates and guidelines for code generation',
    icon: <ScrollText className="w-5 h-5" />,
    color: 'violet',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/prompt-engine',
  },
  {
    id: 'chat',
    name: 'chat',
    shortDescription: 'AI chat system with multi-provider LLM support and streaming',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'blue',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/chat',
  },
  {
    id: 'code-editor',
    name: 'code-editor',
    shortDescription: 'Monaco Editor integration with syntax highlighting and themes',
    icon: <Code2 className="w-5 h-5" />,
    color: 'yellow',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/code-editor',
  },
  {
    id: 'visual-edits',
    name: 'visual-edits',
    shortDescription: 'Point-and-click visual editing powered by custom Babel plugin',
    icon: <MousePointer2 className="w-5 h-5" />,
    color: 'violet',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/visual-edits',
  },
  {
    id: 'remote-control',
    name: 'remote-control',
    shortDescription: 'Real-time remote control for mobile devices with live preview and interaction sync',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'cyan',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/remote-control',
  },
  {
    id: 'database',
    name: 'database',
    shortDescription: 'PostgreSQL database layer with Drizzle ORM and Neon support',
    icon: <Database className="w-5 h-5" />,
    color: 'emerald',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/database',
  },
  {
    id: 'auth',
    name: 'auth',
    shortDescription: 'Authentication system with Better Auth and OAuth support',
    icon: <Key className="w-5 h-5" />,
    color: 'orange',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/auth',
  },
  {
    id: 'convex',
    name: 'convex',
    shortDescription: 'Convex backend integration for serverless functions and real-time data',
    icon: <Server className="w-5 h-5" />,
    color: 'cyan',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/convex',
  },
  {
    id: 'publish',
    name: 'publish',
    shortDescription: 'Cloudflare Pages deployment with custom domain management',
    icon: <Globe className="w-5 h-5" />,
    color: 'blue',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/publish',
  },
  {
    id: 'pusher',
    name: 'pusher',
    shortDescription: 'Real-time communication with Pusher for live updates',
    icon: <Radio className="w-5 h-5" />,
    color: 'pink',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/pusher',
  },
  {
    id: 'payments',
    name: 'payments',
    shortDescription: 'Subscription billing with Polar integration',
    icon: <Wallet className="w-5 h-5" />,
    color: 'green',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/payments',
  },
  {
    id: 'integrations',
    name: 'integrations',
    shortDescription: 'slash (/) command to trigger integrations including Google, Resend, and AI LLM services',
    icon: <Layers className="w-5 h-5" />,
    color: 'orange',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/integrations',
  },
  {
    id: 'restore',
    name: 'restore',
    shortDescription: 'Git-based history and project restoration',
    icon: <History className="w-5 h-5" />,
    color: 'amber',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/restore',
  },
  {
    id: 'remix',
    name: 'remix',
    shortDescription: 'Project forking and remixing functionality',
    icon: <GitFork className="w-5 h-5" />,
    color: 'teal',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/remix',
  },
  {
    id: 'error-manager',
    name: 'error-manager',
    shortDescription: 'Error handling with toast notifications and real-time updates',
    icon: <Zap className="w-5 h-5" />,
    color: 'red',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/error-manager',
  },
  {
    id: 'ui',
    name: 'ui',
    shortDescription: 'Shared UI component library built with shadcn/ui and Radix',
    icon: <Palette className="w-5 h-5" />,
    color: 'indigo',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/ui',
  },
  {
    id: 'config',
    name: 'config',
    shortDescription: 'Shared configuration and template management',
    icon: <Settings className="w-5 h-5" />,
    color: 'gray',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/config',
  },
  {
    id: 'types',
    name: 'types',
    shortDescription: 'Shared TypeScript type definitions',
    icon: <FileCode className="w-5 h-5" />,
    color: 'blue',
    docsPath: 'https://github.com/flutter-vibe-code/flutter-vibe-code-sdk/tree/main/packages/types',
  },
]

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/30' },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  violet: { bg: 'bg-violet-500/20', text: 'text-violet-500', border: 'border-violet-500/30' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500/30' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/30' },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500/30' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-500', border: 'border-amber-500/30' },
  teal: { bg: 'bg-teal-500/20', text: 'text-teal-500', border: 'border-teal-500/30' },
  red: { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' },
  indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-500', border: 'border-indigo-500/30' },
  gray: { bg: 'bg-gray-500/20', text: 'text-gray-500', border: 'border-gray-500/30' },
}

export function SelfHostedPackages() {
  return (
    <section className="w-full bg-background py-20 pt-[5px] md:py-32 md:pt-0 md:-top-[240px] md:relative">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Hero Headline */}
        <div className="text-center mb-8 md:mb-12 max-w-4xl m-auto">
          <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 leading-tight">
            Vibe coding platform powered by Next.js and Flutter/Expo
            <br />
            <span className="font-bold">that creates native mobile and web apps with AI</span>
          </h3>
          <p className="text-muted-foreground text-md md:text-lg max-w-2xl mx-auto">
            Fork, customize, and self-host your own version of Flutter Vibe Code SDK with the first OSS focus purpose AI agent and web IDE platform that creates native mobile and web apps.
          </p>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {packages.map((pkg) => {
            const colors = colorClasses[pkg.color] || colorClasses.blue
            return (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                colors={colors}
              />
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 md:mt-24">
          <p className="text-muted-foreground text-sm md:text-base mb-4">
            Ready to self-host your own AI-powered IDE?
          </p>
          <a
            href="https://github.com/flutter-vibe-code/flutter-vibe-code-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          >
            <Package className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}

function PackageCard({
  pkg,
  colors,
}: {
  pkg: PackageInfo
  colors: { bg: string; text: string; border: string }
}) {
  return (
    <div
      className={cn(
        "group rounded-2xl bg-card border border-border/50 p-6 hover:shadow-lg transition-all duration-200 hover:border-border flex flex-col"
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            colors.bg,
            colors.text
          )}
        >
          {pkg.icon}
        </div>
        <div className="min-w-0">
          <h4 className="font-mono text-sm font-medium text-foreground truncate">
            {pkg.name}
          </h4>
        </div>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
        {pkg.shortDescription}
      </p>

      <Button
        variant="outline"
        size="sm"
        asChild
        className="w-full justify-center"
      >
        <a href={pkg.docsPath} target="_blank" rel="noopener noreferrer">
          Learn more
        </a>
      </Button>
    </div>
  )
}
