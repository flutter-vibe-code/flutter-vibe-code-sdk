"use client"

import { useState, useEffect } from "react"
import { Database, RefreshCw, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConvexConnectButton } from "@/components/convex/ConvexConnectButton"
import { ConvexManagedButton } from "@/components/convex/ConvexManagedButton"
import { ConvexTeamSelector } from "@/components/convex/ConvexTeamSelector"
import { cn } from "@/lib/utils"

interface BackendPanelProps {
  projectId?: string
  onClose: () => void
}

interface ConvexState {
  connected: boolean
  state: any
  credentials?: {
    mode: "oauth" | "managed"
    teamSlug: string
    projectSlug: string
    deploymentUrl: string
    deploymentName: string
  }
  devRunning: boolean
}

export function BackendPanel({ projectId, onClose }: BackendPanelProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [status, setStatus] = useState<ConvexState | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch status on mount and when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchStatus()
    }
  }, [projectId])

  // Handle OAuth callback params and refetch status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const convexSuccess = params.get("convex_success")

    if (convexSuccess === "1") {
      fetchStatus()
      // Clean up URL params
      const url = new URL(window.location.href)
      url.searchParams.delete("convex_success")
      url.searchParams.delete("convex_token")
      url.searchParams.delete("convex_deployment_name")
      url.searchParams.delete("convex_deployment_url")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  const fetchStatus = async () => {
    if (!projectId) return
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/convex/status?projectId=${projectId}`)
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error fetching Convex status:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this Convex project?")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/convex/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        await fetchStatus()
      } else {
        const error = await response.json()
        alert(`Failed to disconnect: ${error.error}`)
      }
    } catch (error) {
      console.error("Error disconnecting:", error)
      alert("Failed to disconnect from Convex")
    } finally {
      setLoading(false)
    }
  }

  const handleStartDev = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/convex/dev/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        await fetchStatus()
      } else {
        const error = await response.json()
        alert(`Failed to start Convex dev: ${error.error}`)
      }
    } catch (error) {
      console.error("Error starting Convex dev:", error)
      alert("Failed to start Convex dev server")
    } finally {
      setLoading(false)
    }
  }

  const handleStopDev = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/convex/dev/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        await fetchStatus()
      } else {
        const error = await response.json()
        alert(`Failed to stop Convex dev: ${error.error}`)
      }
    } catch (error) {
      console.error("Error stopping Convex dev:", error)
      alert("Failed to stop Convex dev server")
    } finally {
      setLoading(false)
    }
  }

  const handlePushChanges = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/convex/dev/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        alert("Convex changes pushed successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to push changes: ${error.error}`)
      }
    } catch (error) {
      console.error("Error pushing Convex changes:", error)
      alert("Failed to push Convex changes")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!status) return null

    if (status.connected && status.state?.kind === "connected") {
      return <Badge variant="default">Connected</Badge>
    } else if (status.state?.kind === "connecting") {
      return <Badge variant="secondary">Connecting...</Badge>
    } else if (status.state?.kind === "failed") {
      return <Badge variant="destructive">Failed</Badge>
    } else {
      return <Badge variant="outline">Not Connected</Badge>
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-[50px] border-b pr-12 pl-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <img src="/icons/convex-icon.svg" alt="Convex" className="h-5 w-5" />
          Backend
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchStatus}
          disabled={isRefreshing || !projectId}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Centered content container with max-width */}
      <div className="flex-1 flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-[800px] flex flex-col h-full p-4">
          {!projectId ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Database className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="font-medium text-muted-foreground">No project selected</p>
              <p className="text-sm text-muted-foreground/70">
                Create or select a project to connect a backend
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                Add a Convex backend for database, auth, and real-time features.
              </p>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge()}
              </div>

              {/* Connection UI */}
              {status?.connected && status.credentials ? (
                <>
                  {/* Connected State */}
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Mode:</span>
                      <Badge variant={status.credentials.mode === "managed" ? "secondary" : "default"}>
                        {status.credentials.mode === "managed" ? "Managed" : "Your Account"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Project:</span>
                      <span className="text-sm font-medium">{status.credentials.projectSlug}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Team:</span>
                      <span className="text-sm font-medium">{status.credentials.teamSlug}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dev Server:</span>
                      {status.devRunning ? (
                        <Badge variant="default">Running</Badge>
                      ) : (
                        <Badge variant="outline">Stopped</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://dashboard.convex.dev/d/${status.credentials.deploymentName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      Open in Convex Dashboard
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <div className="flex gap-2">
                      {status.devRunning ? (
                        <Button
                          onClick={handleStopDev}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Stop Dev Server
                        </Button>
                      ) : (
                        <Button
                          onClick={handleStartDev}
                          disabled={loading}
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          Start Dev Server
                        </Button>
                      )}
                      <Button
                        onClick={handlePushChanges}
                        disabled={loading}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        Push Changes
                      </Button>
                    </div>

                    <Button
                      onClick={handleDisconnect}
                      disabled={loading}
                      variant="destructive"
                      size="sm"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>
                </>
              ) : status?.state?.kind === "failed" ? (
                <>
                  {/* Failed State */}
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">
                      Error: {status.state.errorMessage}
                    </p>
                  </div>
                  <Tabs defaultValue="managed" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="managed">Managed Backend</TabsTrigger>
                      <TabsTrigger value="oauth">Your Convex Account</TabsTrigger>
                    </TabsList>

                    <TabsContent value="managed" className="space-y-3">
                      <ConvexManagedButton
                        projectId={projectId}
                        onSuccess={() => {
                          fetchStatus()
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="oauth" className="space-y-3">
                      <ConvexTeamSelector
                        value={selectedTeam}
                        onChange={setSelectedTeam}
                      />
                      <ConvexConnectButton
                        projectId={projectId}
                        teamSlug={selectedTeam}
                        onSuccess={() => {
                          fetchStatus()
                        }}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              ) : status?.state?.kind === "connecting" ? (
                <>
                  {/* Connecting State */}
                  <div className="rounded-lg border p-4 flex items-center gap-3">
                    <span className="animate-spin">⏳</span>
                    <span className="text-sm">Provisioning Convex project...</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Not Connected State - Show both options */}
                  <Tabs defaultValue="managed" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="managed">Managed Backend</TabsTrigger>
                      <TabsTrigger value="oauth">Your Convex Account</TabsTrigger>
                    </TabsList>

                    <TabsContent value="managed" className="space-y-3">
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm text-blue-900">
                          We&apos;ll create and manage a Convex backend for you. No Convex account needed.
                        </p>
                      </div>
                      <ConvexManagedButton
                        projectId={projectId}
                        onSuccess={() => {
                          fetchStatus()
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="oauth" className="space-y-3">
                      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                        <p className="text-sm text-purple-900">
                          Connect your own Convex account to manage your backend directly.
                        </p>
                      </div>
                      <ConvexTeamSelector
                        value={selectedTeam}
                        onChange={setSelectedTeam}
                      />
                      <ConvexConnectButton
                        projectId={projectId}
                        teamSlug={selectedTeam}
                        onSuccess={() => {
                          fetchStatus()
                        }}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
