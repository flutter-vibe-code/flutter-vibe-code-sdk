'use client'

import { Button } from '@flutter-vibe-code/ui/components/button'
import { Avatar, AvatarImage, AvatarFallback } from '@flutter-vibe-code/ui/components/avatar'
import { useEffect, useState } from 'react'
import {
  Loader2,
  GitFork,
  ExternalLink,
  Sparkles,
  Smartphone,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import type { PublicProject } from '../types'

export interface RemixPageProps {
  projectId: string
  session: {
    user?: {
      id?: string
      email?: string
      name?: string
      image?: string
    }
  } | null
  isSessionLoading?: boolean
  onSignIn: (callbackUrl: string) => void
  onNavigate: (path: string) => void
  apiBasePath?: string
}

export function RemixPage({
  projectId,
  session,
  isSessionLoading = false,
  onSignIn,
  onNavigate,
  apiBasePath = '/api',
}: RemixPageProps) {
  const { resolvedTheme } = useTheme()

  const [project, setProject] = useState<PublicProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRemixing, setIsRemixing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to home if project is private
  useEffect(() => {
    if (error === 'private') {
      onNavigate('/')
    }
  }, [error, onNavigate])

  useEffect(() => {
    if (!projectId) return

    const fetchPublicProject = async () => {
      try {
        const response = await fetch(`${apiBasePath}/projects/${projectId}/public`)

        if (!response.ok) {
          if (response.status === 404) {
            const errorData = await response.json()
            // Check if it's specifically a private project error
            if (errorData.error === 'This project is not public') {
              setError('private')
              return // Will redirect via useEffect above
            } else {
              setError('This project is not publicly available')
            }
          } else {
            setError('Failed to load project')
          }
          setIsLoading(false)
          return
        }

        const data = await response.json()
        setProject(data.project)
      } catch (err) {
        console.error('Error fetching public project:', err)
        setError('Failed to load project')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPublicProject()
  }, [projectId, apiBasePath])

  const handleRemix = async () => {
    if (!session?.user?.id) {
      toast.error('Please sign in to remix this project')
      return
    }

    setIsRemixing(true)
    try {
      const response = await fetch(`${apiBasePath}/projects/${projectId}/remix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID: session.user.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to remix project')
        setIsRemixing(false)
        return
      }

      // Show warnings if there were any issues
      if (result.warnings && result.warnings.length > 0) {
        // Show each warning as a separate toast
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, {
            duration: 5000,
          })
        })
      } else {
        toast.success('Project remixed successfully!')
      }

      // Redirect to the new remixed project with remixed query param
      // This tells the project page to skip container initialization since remix API already handled it
      setTimeout(() => {
        window.location.href = `/p/${result.projectId}?remixed=true`
      }, 1500) // Slightly longer delay to allow toasts to be seen
    } catch (error) {
      console.error('Error remixing project:', error)
      toast.error('Failed to remix project')
      setIsRemixing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading project...</span>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-2">
            {error === 'private' ? 'Project is Private' : 'Project Not Found'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error === 'private'
              ? 'This project is private and cannot be viewed or remixed.'
              : error || 'This project does not exist or is not publicly available.'}
          </p>
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src={
                mounted && resolvedTheme === 'dark'
                  ? '/react-native-vibe-code-long-logo-dark.svg'
                  : '/react-native-vibe-code-long-logo.svg'
              }
              alt="Logo"
              className="w-[120px] h-[29px] sm:w-[240px] sm:h-[58px]"
            />
          </Link>
          {!session ? (
            <Button onClick={() => onSignIn(window.location.href)}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in to Remix
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {session.user?.email}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    session.user?.image ||
                    `https://avatar.vercel.sh/${session.user?.email}`
                  }
                  alt={session.user?.email || 'User'}
                />
                <AvatarFallback>
                  {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {!session && (
            <>
              {/* Promotional Card */}
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      Turn text to mobile & web apps in seconds
                    </h3>
                  </div>
                  <p className="text-muted-foreground">
                    Ask chat anything, and turn your words into iOS, Android and web
                    apps at the same time.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>iOS & Android</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      <span>Web Apps</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign in prompt */}
              <div className="p-4 rounded-lg border bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Sign in with Google to remix this project and start building your
                  own version.
                </p>
              </div>
            </>
          )}
          {/* Project Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">{project.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={
                          project.userImage ||
                          `https://avatar.vercel.sh/${project.userId}`
                        }
                        alt={project.userName || 'User'}
                      />
                      <AvatarFallback>{project.userName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span>Created by {project.userName || 'Anonymous'}</span>
                  </div>
                  <span>-</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 sm:flex-none"
                  onClick={handleRemix}
                  disabled={isRemixing || !session}
                >
                  {isRemixing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Remixing...
                    </>
                  ) : (
                    <>
                      <GitFork className="mr-2 h-4 w-4" />
                      Remix This Project
                    </>
                  )}
                </Button>

                {project.deployedUrl && (
                  <Button variant="outline" size="lg" asChild>
                    <a
                      href={
                        project.deployedUrl.startsWith('http')
                          ? project.deployedUrl
                          : `https://${project.deployedUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Live App
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Remix Stats */}
            {parseInt(project.forkCount) > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitFork className="h-4 w-4" />
                <span>
                  Remixed {project.forkCount}{' '}
                  {parseInt(project.forkCount) === 1 ? 'time' : 'times'}
                </span>
              </div>
            )}
          </div>

          {/* Preview - Screenshots */}
          {project.screenshotMobile || project.screenshotDesktop ? (
            <div className="border rounded-lg overflow-hidden bg-muted/20">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="text-sm font-medium">Preview</h3>
              </div>
              <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/10">
                <div className="flex flex-row gap-6">
                  {/* Mobile Screenshot */}
                  {project.screenshotMobile && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Mobile App
                      </h4>
                      <div className="flex justify-center">
                        <div className="relative max-w-[375px] w-full">
                          <img
                            src={project.screenshotMobile}
                            alt="Mobile Preview"
                            className="w-full h-auto rounded-lg shadow-2xl min-w-[375px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desktop Screenshot */}
                  {project.screenshotDesktop && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Desktop web app
                      </h4>
                      <div>
                        <img
                          src={project.screenshotDesktop}
                          alt="Desktop Preview"
                          className="w-full h-auto rounded-lg shadow-2xl min-w-[700px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-muted/20 p-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">
                  Preview screenshots are being generated...
                </p>
                <p className="text-sm">
                  Screenshots will appear here once the project is ready.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
