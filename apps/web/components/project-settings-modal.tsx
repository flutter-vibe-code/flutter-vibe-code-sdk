'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { GitFork, Globe, Lock, AlertCircle, Crown, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSubscriptionStatus } from '@/lib/polar-client'

interface TwitterLinkStatus {
  linked: boolean
  twitterUsername?: string
  linkedAt?: string | null
}

interface ProjectSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  userID?: string
  initialIsPublic?: boolean
  forkCount?: string
  onVisibilityChange?: (isPublic: boolean) => void
}

export function ProjectSettingsModal({
  open,
  onOpenChange,
  projectId,
  userID,
  initialIsPublic = false,
  forkCount = '0',
  onVisibilityChange,
}: ProjectSettingsModalProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { isProSubscriber, isLoading: isLoadingSubscription } = useSubscriptionStatus()
  const isFreeUser = !isLoadingSubscription && !isProSubscriber

  // Twitter linking state
  const [twitterStatus, setTwitterStatus] = useState<TwitterLinkStatus | null>(null)
  const [isLoadingTwitter, setIsLoadingTwitter] = useState(false)
  const [isUnlinkingTwitter, setIsUnlinkingTwitter] = useState(false)

  // Fetch Twitter link status when modal opens
  useEffect(() => {
    if (open) {
      fetchTwitterStatus()
    }
  }, [open])

  const fetchTwitterStatus = async () => {
    setIsLoadingTwitter(true)
    try {
      const response = await fetch('/api/auth/twitter/status')
      if (response.ok) {
        const data = await response.json()
        setTwitterStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch Twitter status:', error)
    } finally {
      setIsLoadingTwitter(false)
    }
  }

  const handleLinkTwitter = () => {
    window.location.href = '/api/auth/twitter/link'
  }

  const handleUnlinkTwitter = async () => {
    setIsUnlinkingTwitter(true)
    try {
      const response = await fetch('/api/auth/twitter/unlink', {
        method: 'POST',
      })
      if (response.ok) {
        setTwitterStatus({ linked: false })
        toast.success('X account unlinked successfully')
      } else {
        toast.error('Failed to unlink X account')
      }
    } catch (error) {
      console.error('Unlink error:', error)
      toast.error('Failed to unlink X account')
    } finally {
      setIsUnlinkingTwitter(false)
    }
  }

  // Update local state when props change
  useEffect(() => {
    setIsPublic(initialIsPublic)
    setHasChanges(false)
  }, [initialIsPublic, open, projectId])

  const handleToggle = (checked: boolean) => {
    setIsPublic(checked)
    setHasChanges(checked !== initialIsPublic)
  }

  const handleSave = async () => {
    if (!projectId || !userID) {
      toast.error('Missing project or user information')
      return
    }

    if (!hasChanges) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic,
          userID,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.requiresUpgrade) {
          toast.error(result.error, {
            duration: 5000,
            action: {
              label: 'Upgrade',
              onClick: () => {
                // Navigate to subscription page
                window.location.href = '/subscription'
              },
            },
          })
        } else {
          toast.error(result.error || 'Failed to update project visibility')
        }
        setIsPublic(initialIsPublic)
        setHasChanges(false)
        return
      }

      toast.success(
        isPublic
          ? 'Project is now public and can be remixed'
          : 'Project is now private'
      )

      // Screenshots are triggered from preview-panel.tsx when iframe loads
      // This ensures the app is actually ready before taking screenshots

      if (onVisibilityChange) {
        onVisibilityChange(isPublic)
      }

      setHasChanges(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast.error('Failed to update project visibility')
      setIsPublic(initialIsPublic)
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsPublic(initialIsPublic)
    setHasChanges(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Manage your project visibility and sharing options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Visibility Toggle */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="visibility" className="text-base font-medium">
                Public Project
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone to view and remix this project
              </p>
            </div>
            <Switch
              id="visibility"
              checked={isPublic}
              onCheckedChange={handleToggle}
              disabled={isSaving}
            />
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={isPublic ? 'default' : 'secondary'}>
              {isPublic ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  Private
                </>
              )}
            </Badge>
            {parseInt(forkCount) > 0 && (
              <Badge variant="outline">
                <GitFork className="mr-1 h-3 w-3" />
                {forkCount} {parseInt(forkCount) === 1 ? 'remix' : 'remixes'}
              </Badge>
            )}
          </div>

          {/* Information Alert */}
          {isPublic ? (
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                This project is publicly accessible. Anyone with the link can
                view and remix it.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                This project is private. Only you can access it.
              </AlertDescription>
            </Alert>
          )}

          {/* Free Plan Notice - Only show for free users trying to make project private */}
          {!isPublic && isFreeUser && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Free plan projects are public by default. Upgrade to a paid plan
                to create private projects.
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-destructive hover:text-destructive/80 ml-1"
                  onClick={() => {
                    window.location.href = '/subscription'
                  }}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Upgrade Now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* X.com Linking Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <Label className="text-base font-medium">X (Twitter) Integration</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Link your X account to create apps by mentioning @capsulethis
            </p>

            {isLoadingTwitter ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </div>
            ) : twitterStatus?.linked ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">@{twitterStatus.twitterUsername}</p>
                      <p className="text-xs text-muted-foreground">
                        Linked{' '}
                        {twitterStatus.linkedAt
                          ? new Date(twitterStatus.linkedAt).toLocaleDateString()
                          : 'recently'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnlinkTwitter}
                    disabled={isUnlinkingTwitter}
                  >
                    {isUnlinkingTwitter ? 'Unlinking...' : 'Unlink'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tweet at @capsulethis with your app idea and we&apos;ll build it for you!
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleLinkTwitter}
                className="w-full"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Link X Account
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
