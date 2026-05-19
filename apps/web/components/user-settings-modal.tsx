'use client'

import React, { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { signOut } from '@/lib/auth/client'

interface UserSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
}

export const UserSettingsModal = React.memo(function UserSettingsModal({
  open,
  onOpenChange,
  userEmail,
}: UserSettingsModalProps) {
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Account deleted successfully')
        // Sign out the user and redirect
        await signOut()
        // Close modal
        onOpenChange(false)
        // Redirect to home
        window.location.href = '/'
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseModal = () => {
    setIsDeleteAccountOpen(false)
    setConfirmationText('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={handleCloseModal}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <Label className="text-sm font-medium text-destructive">
                Danger Zone
              </Label>
            </div>

            {!isDeleteAccountOpen ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteAccountOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Are you absolutely sure?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data including:
                  </p>
                  <ul className="text-sm text-muted-foreground ml-4 list-disc space-y-1">
                    <li>All your projects and code</li>
                    <li>Your subscription and billing data</li>
                    <li>All conversations and chat history</li>
                    <li>Team memberships and associated data</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">
                      Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm:
                    </Label>
                    <Input
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="Type DELETE here"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDeleteAccountOpen(false)
                        setConfirmationText('')
                      }}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={confirmationText !== 'DELETE' || isDeleting}
                      className="flex-1"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})