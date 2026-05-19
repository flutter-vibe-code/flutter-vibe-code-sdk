"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { FolderOpen, Search, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Project } from '@flutter-vibe-code/database'

interface ProjectsPanelProps {
  userId?: string
  onClose: () => void
}

export function ProjectsPanel({ userId, onClose }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchProjects = useCallback(async (search?: string) => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ userID: userId })
      if (search) {
        params.append("search", search)
      }
      const response = await fetch(`/api/projects?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError("Failed to load projects")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchProjects(value || undefined)
    }, 300)
  }, [fetchProjects])

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-[50px] border-b pr-12 pl-4">
        <h2 className="font-semibold text-lg">Projects</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchProjects(searchQuery || undefined)}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Centered content container with max-width */}
      <div className="flex-1 flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-[800px] flex flex-col h-full">
          {/* Search area */}
          <div className="m-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {error && (
            <div className="mx-4 mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Projects list */}
          <ScrollArea className="flex-1 px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="font-medium text-muted-foreground">
                  {searchQuery ? `No projects found matching "${searchQuery}"` : "No projects yet"}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {searchQuery ? "Try a different search term" : "Create your first project to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/p/${project.id}`}
                    className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                    onClick={onClose}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="capitalize">
                            {project.template?.replace(/-/g, " ")}
                          </span>
                          {" • "}
                          <span className="capitalize">{project.status}</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4 shrink-0">
                        {project.updatedAt
                          ? formatDate(project.updatedAt)
                          : ""}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
