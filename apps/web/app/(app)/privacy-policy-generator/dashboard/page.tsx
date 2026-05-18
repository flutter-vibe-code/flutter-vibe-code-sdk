'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import { Plus, FileText, Clock, CheckCircle, Trash2, Eye, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrivacyPolicy } from '@flutter-vibe-code/database'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function PolicyDashboard() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession()
  const [policies, setPolicies] = useState<PrivacyPolicy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push('/privacy-policy-generator')
    }
  }, [session, isSessionLoading, router])

  useEffect(() => {
    if (session) {
      fetchPolicies()
    }
  }, [session])

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/privacy-policies')
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies)
      }
    } catch (error) {
      console.error('Error fetching policies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/privacy-policies/${deleteId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPolicies(policies.filter((p) => p.id !== deleteId))
      }
    } catch (error) {
      console.error('Error deleting policy:', error)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleCreateNew = () => {
    router.push('/privacy-policy-generator/new')
  }

  if (isSessionLoading || !session) {
    return (
      <div className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your Privacy Policies
            </h1>
            <p className="text-muted-foreground">
              Manage and create privacy policies for your iOS apps
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Policy
          </Button>
        </div>

        {/* Policies List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading policies...
          </div>
        ) : policies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No policies yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first privacy policy to get started
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onView={() => router.push(`/privacy-policy-generator/${policy.id}`)}
                onEdit={() => router.push(`/privacy-policy-generator/new?edit=${policy.id}`)}
                onDelete={() => setDeleteId(policy.id)}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Privacy Policy</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this privacy policy? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

function PolicyCard({
  policy,
  onView,
  onEdit,
  onDelete,
}: {
  policy: PrivacyPolicy
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isCompleted = policy.status === 'completed'
  const formattedDate = policy.updatedAt
    ? new Date(policy.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown'

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {policy.appName}
            </h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                isCompleted
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-amber-500/10 text-amber-500'
              )}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  Draft
                </>
              )}
            </span>
          </div>
          {policy.companyName && (
            <p className="text-sm text-muted-foreground mb-1">{policy.companyName}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Last updated: {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="text-muted-foreground hover:text-foreground"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:border-red-500/50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
