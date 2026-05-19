import { Loader2 } from 'lucide-react'

// Skeleton components for instant loading state
function ProjectTitleSkeleton() {
  return (
    <div className="flex justify-center px-4 py-2 border-b h-[50px] items-center">
      <div className="h-5 w-40 rounded bg-muted animate-pulse" />
    </div>
  )
}

function ChatPanelSkeleton() {
  return (
    <div className="flex flex-col h-full border-r">
      {/* Messages area */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function PreviewPanelSkeleton() {
  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
        </div>
      </div>

      {/* Preview content area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          {/* Phone frame skeleton */}
          <div className="w-[280px] h-[560px] rounded-[2.5rem] border-4 border-muted-foreground/20 bg-background overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Status bar */}
              <div className="h-8 bg-muted/50 flex items-center justify-between px-4">
                <div className="h-3 w-8 rounded bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              </div>
              {/* Content */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileTabsSkeleton() {
  return (
    <div className="border-b bg-background w-full md:hidden">
      <div className="flex">
        <div className="flex-1 py-3 px-4 border-b-2 border-primary">
          <div className="h-4 w-12 mx-auto rounded bg-muted animate-pulse" />
        </div>
        <div className="flex-1 py-3 px-4">
          <div className="h-4 w-16 mx-auto rounded bg-muted animate-pulse" />
        </div>
        <div className="flex-1 py-3 px-4">
          <div className="h-4 w-20 mx-auto rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Mobile tabs - only visible on mobile */}
      <MobileTabsSkeleton />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile view - Chat panel with title */}
        <div className="flex-1 flex flex-col md:hidden">
          <ProjectTitleSkeleton />
          <ChatPanelSkeleton />
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex flex-1">
          {/* Chat panel - 500px fixed width with title */}
          <div className="w-[500px] flex-shrink-0 flex flex-col">
            <ProjectTitleSkeleton />
            <ChatPanelSkeleton />
          </div>

          {/* Preview panel - takes remaining space */}
          <div className="flex-1">
            <PreviewPanelSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
