"use client"

import { useState, useEffect, useRef } from "react"
import { Image, FolderOpen, Database, ChevronLeft, ChevronRight, X, MessageSquare, Cloud, KeyRound, Settings2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { AssetsPanel } from "@/components/assets-panel"
import { ProjectsPanel } from "@/components/projects-panel"
import { BackendPanel } from "@/components/backend-panel"
import { CloudSidebarPanel } from "@/components/cloud-sidebar-panel"
import { EnvVarsPanel } from "@/components/env-vars-panel"
import { ByokPanel } from "@/components/byok-panel"
import { UserMenu } from "@/components/user-menu"
import { BrandCap } from "@/components/brand-logo"
import { Session } from "@/lib/auth"
import { cn } from "@/lib/utils"
import Link from "next/link"
import posthog from 'posthog-js'

interface AppSidebarProps {
  children: React.ReactNode
  sandboxId?: string
  projectId?: string
  userId?: string
  session?: Session | null
  onOpenSubscriptionModal?: () => void
  onOpenUserSettingsModal?: () => void
  onOpenProjectSettingsModal?: () => void
  onSignOut?: () => void
  activePanel?: string | null
  onPanelChange?: (panel: string | null) => void
  cloudEnabled?: boolean
  cloudDeploymentUrl?: string
  onCloudEnabled?: () => void
  onRequestChange?: (prompt: string) => void
}

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className="absolute -right-3 top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background  hover:bg-accent"
    >
      {state === "expanded" ? (
        <ChevronLeft className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
    </button>
  )
}

function SidebarNav({
  activePanel,
  onPanelChange,
  session,
  projectId,
  onOpenSubscriptionModal,
  onOpenUserSettingsModal,
  onOpenProjectSettingsModal,
  onSignOut,
}: {
  activePanel: string | null
  onPanelChange: (panel: string | null) => void
  session?: Session | null
  projectId?: string
  onOpenSubscriptionModal?: () => void
  onOpenUserSettingsModal?: () => void
  onOpenProjectSettingsModal?: () => void
  onSignOut?: () => void
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const menuItems = [
    {
      id: "assets",
      label: "Assets",
      icon: Image,
      spacer: false,
    },
    {
      id: "cloud",
      label: "Cloud",
      icon: Cloud,
      spacer: false,
    },
    {
      id: "byok",
      label: "BYOK",
      icon: KeyRound,
      spacer: false,
    },
    {
      id: "backend",
      label: "Backend",
      icon: Database,
      spacer: false,
    },
    {
      id: "envvars",
      label: "Env Vars",
      icon: Settings2,
      spacer: false,
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderOpen,
      spacer: true,
    },
  ]

  // Premium IDE rail: glass background, active items get an accent border-l +
  // bg pill, hover items animate on transform (GPU-only). Group separators are
  // a gradient line, not a flat border.
  const railSurface =
    "bg-gradient-to-b from-orange-50/40 via-background/60 to-background/80 dark:from-orange-950/20 dark:via-background/70 dark:to-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40"
  const itemBase =
    "relative transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5"
  const itemActive =
    "data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-500/10 data-[active=true]:to-transparent data-[active=true]:text-foreground data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:h-6 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-gradient-to-b data-[active=true]:before:from-orange-400 data-[active=true]:before:to-amber-500 data-[active=true]:before:shadow-[0_0_12px_rgba(249,115,22,0.5)]"

  return (
    <Sidebar collapsible="icon" className={cn("border-r border-border/40 pt-[10px]", railSurface)}>
      <Link
        href="/"
        className="group relative flex items-center justify-center w-full py-3 transition-transform hover:scale-105"
        aria-label="Flutter Vibe Code"
      >
        <BrandCap size="md" className="ring-2 ring-orange-400/30 group-hover:ring-orange-400/60 transition-all shadow-[0_6px_20px_-6px_rgba(249,115,22,0.5)]" />
      </Link>
      {/* Top divider — gradient hairline, not a flat border */}
      <div aria-hidden className="mx-3 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      <SidebarContent className={cn("pt-3 px-1", railSurface)}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Chat"
                  isActive={activePanel === null}
                  onClick={() => {
                    posthog.capture('sidebar_section_clicked', { section: 'chat' })
                    onPanelChange(null)
                  }}
                  className={cn(itemBase, itemActive)}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id} className={cn(item.id === 'backend' && 'hidden')}>
                  {item.spacer && (
                    <div aria-hidden className="my-2 mx-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  )}
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={activePanel === item.id}
                    onClick={() => {
                      posthog.capture('sidebar_section_clicked', { section: item.id })
                      onPanelChange(activePanel === item.id ? null : item.id)
                    }}
                    className={cn(itemBase, itemActive)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className={cn("p-2", railSurface)}>
        <UserMenu
          session={session}
          projectId={projectId}
          onOpenSubscriptionModal={onOpenSubscriptionModal || (() => {})}
          onOpenUserSettingsModal={onOpenUserSettingsModal || (() => {})}
          onOpenProjectSettingsModal={onOpenProjectSettingsModal || (() => {})}
          onSignOut={onSignOut}
          collapsed={isCollapsed}
        />
      </SidebarFooter>
      <SidebarRail />
      {/* <SidebarToggle /> */}
    </Sidebar>
  )
}

// Panel content wrapper with conditional animation
function PanelContent({
  isBottomOption,
  isOpen,
  isFirstOpen,
  isSwitching,
  children,
  onClose,
}: {
  isBottomOption: boolean
  isOpen: boolean
  isFirstOpen: boolean
  isSwitching: boolean
  children: React.ReactNode
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Check if clicked on sidebar (don't close if clicking sidebar items)
        const sidebar = document.querySelector('[data-sidebar="sidebar"]')
        if (sidebar && sidebar.contains(event.target as Node)) {
          return
        }
        onClose()
      }
    }

    if (isOpen) {
      // Delay adding listener to avoid immediate close
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 0)
      return () => {
        clearTimeout(timer)
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  // When switching between panels, no animation needed
  if (isSwitching) {
    return (
      <div
        ref={panelRef}
        className={cn(
          "absolute inset-y-0 left-0 z-40 w-full sm:max-w-[500px] bg-background/70 backdrop-blur-xl border-r border-border/60 ",
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none hidden",
          isBottomOption && "max-h-[calc(100%-85px)]"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute inset-y-0 left-0 z-40 w-full sm:max-w-[500px] bg-background/70 backdrop-blur-xl border-r border-border/60 ",
        "transition-all duration-300 ease-in-out",
        isOpen
          ? isFirstOpen
            ? "opacity-100 translate-x-0 animate-in slide-in-from-left duration-300"
            : "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-full pointer-events-none",
        isBottomOption && "max-h-[calc(100%-85px)] border-b-1 border-gray-300"
      )}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      {children}
    </div>
  )
}

export function AppSidebar({
  children,
  sandboxId,
  projectId,
  userId,
  session,
  onOpenSubscriptionModal,
  onOpenUserSettingsModal,
  onOpenProjectSettingsModal,
  onSignOut,
  activePanel: controlledActivePanel,
  onPanelChange,
  cloudEnabled,
  cloudDeploymentUrl,
  onCloudEnabled,
  onRequestChange,
}: AppSidebarProps) {
  const [internalActivePanel, setInternalActivePanel] = useState<string | null>(null)
  const [isFirstOpen, setIsFirstOpen] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)

  // Use controlled state if provided, otherwise use internal state
  const activePanel = controlledActivePanel !== undefined ? controlledActivePanel : internalActivePanel
  const setActivePanel = onPanelChange || setInternalActivePanel

  const handlePanelChange = (panel: string | null) => {
    // Determine animation type before changing panel
    if (panel !== null && activePanel === null) {
      // Opening from closed state - use slide animation
      setIsFirstOpen(true)
      setIsSwitching(false)
    } else if (panel !== null && activePanel !== null && panel !== activePanel) {
      // Switching between panels - no animation
      setIsSwitching(true)
      setIsFirstOpen(false)
    } else if (panel === null) {
      // Closing panel - use exit animation
      setIsSwitching(false)
    }
    setActivePanel(panel)
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-full w-full">
        {/* Sidebar - always visible and clickable */}
        <div className="relative z-50">
          <SidebarNav
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
            session={session}
            projectId={projectId}
            onOpenSubscriptionModal={onOpenSubscriptionModal}
            onOpenUserSettingsModal={onOpenUserSettingsModal}
            onOpenProjectSettingsModal={onOpenProjectSettingsModal}
            onSignOut={onSignOut}
          />
        </div>

        {/* Main content area with panel overlay */}
        <div className="relative flex-1 min-w-0">
          {/* Main content - always mounted */}
          <div className="h-full w-full">
            {children}
          </div>

          {/* Panel overlay area - positioned relative to content area */}
          <PanelContent
            isOpen={activePanel === "assets"}
            isFirstOpen={isFirstOpen}
            isSwitching={isSwitching}
            onClose={() => handlePanelChange(null)}
          >
            <AssetsPanel
              sandboxId={sandboxId}
              projectId={projectId}
              onClose={() => handlePanelChange(null)}
            />
          </PanelContent>

          <PanelContent
            isOpen={activePanel === "projects"}
            isFirstOpen={isFirstOpen}
            isSwitching={isSwitching}
            onClose={() => handlePanelChange(null)}
          >
            <ProjectsPanel
              userId={userId}
              onClose={() => handlePanelChange(null)}
            />
          </PanelContent>

          <PanelContent
            isOpen={activePanel === "backend"}
            isFirstOpen={isFirstOpen}
            isSwitching={isSwitching}
            onClose={() => handlePanelChange(null)}
          >
            <BackendPanel
              projectId={projectId}
              onClose={() => handlePanelChange(null)}
            />
          </PanelContent>

          <PanelContent
            isOpen={activePanel === "cloud"}
            isFirstOpen={isFirstOpen}
            isSwitching={isSwitching}
            onClose={() => handlePanelChange(null)}
            isBottomOption
          >
            <CloudSidebarPanel
              projectId={projectId}
              cloudEnabled={cloudEnabled || false}
              deploymentUrl={cloudDeploymentUrl}
              onCloudEnabled={onCloudEnabled}
              onRequestChange={onRequestChange}
              onClose={() => handlePanelChange(null)}
            />
          </PanelContent>

          <PanelContent
            isOpen={activePanel === "envvars"}
            isFirstOpen={isFirstOpen}
            isSwitching={isSwitching}
            onClose={() => handlePanelChange(null)}
          >
            <EnvVarsPanel
              projectId={projectId || ''}
              sandboxId={sandboxId}
            />
          </PanelContent>

          <PanelContent
            isOpen={activePanel === "byok"}
            isFirstOpen={isFirstOpen}
            isSwitching={isSwitching}
            onClose={() => handlePanelChange(null)}
            isBottomOption={false}
          >
            <ByokPanel
              onClose={() => handlePanelChange(null)}
            />
          </PanelContent>
        </div>
      </div>
    </SidebarProvider>
  )
}
