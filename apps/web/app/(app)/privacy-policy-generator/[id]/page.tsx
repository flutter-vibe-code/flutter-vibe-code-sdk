'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { PrivacyPolicy } from '@flutter-vibe-code/database'
import { NutritionLabel } from '@/lib/privacy-policy/types'
import { Button } from '@/components/ui/button'
import {
  Copy,
  Download,
  Edit,
  ArrowLeft,
  CheckCircle,
  FileText,
  Apple,
  Link,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ViewPolicyPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { data: session, isPending: isSessionLoading } = useSession()

  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'policy' | 'nutrition'>('policy')
  const [copied, setCopied] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/app-policy/${id}`
    : `/app-policy/${id}`

  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push('/privacy-policy-generator')
    }
  }, [session, isSessionLoading, router])

  useEffect(() => {
    if (session && id) {
      loadPolicy()
    }
  }, [session, id])

  const loadPolicy = async () => {
    try {
      const response = await fetch(`/api/privacy-policies/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPolicy(data.policy)
      } else {
        toast.error('Policy not found')
        router.push('/privacy-policy-generator/dashboard')
      }
    } catch (error) {
      console.error('Error loading policy:', error)
      toast.error('Failed to load policy')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!policy?.generatedPolicy) return

    try {
      await navigator.clipboard.writeText(policy.generatedPolicy)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setUrlCopied(true)
      toast.success('Public URL copied!')
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy URL')
    }
  }

  const handleDownload = () => {
    if (!policy?.generatedPolicy) return

    const blob = new Blob([policy.generatedPolicy], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `privacy-policy-${policy.appName?.toLowerCase().replace(/\s+/g, '-') || 'app'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded!')
  }

  if (isSessionLoading || !session || isLoading) {
    return (
      <div className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center text-muted-foreground">Policy not found</div>
        </div>
      </div>
    )
  }

  const nutritionLabel = policy.nutritionLabel as NutritionLabel | null

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/privacy-policy-generator/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {policy.appName}
              </h1>
              {policy.companyName && (
                <p className="text-muted-foreground">{policy.companyName}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/privacy-policy-generator/new?edit=${policy.id}`)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>

        {/* Public URL Card */}
        {policy.generatedPolicy && (
          <div className="mb-6 p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-foreground">Public URL</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Share this link to embed on your website or submit to app stores
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-sm text-muted-foreground truncate font-mono">
                {publicUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-1 shrink-0"
              >
                {urlCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(publicUrl, '_blank')}
                className="gap-1 shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('policy')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'policy'
                ? 'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            )}
          >
            <FileText className="w-4 h-4" />
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'nutrition'
                ? 'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            )}
          >
            <Apple className="w-4 h-4" />
            Nutrition Label
          </button>
        </div>

        {/* Content */}
        {activeTab === 'policy' ? (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            {/* Actions */}
            <div className="flex items-center justify-end gap-2 p-4 border-b border-border/50 bg-muted-foreground/5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-1"
              >
                <Download className="w-4 h-4" />
                Download .md
              </Button>
            </div>

            {/* Markdown Content */}
            <div className="p-6 md:p-8 prose prose-neutral dark:prose-invert max-w-none">
              {policy.generatedPolicy ? (
                <ReactMarkdown>{policy.generatedPolicy}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">
                  No policy generated yet. Please complete the questionnaire.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                App Privacy Details (Nutrition Label)
              </h2>
              <p className="text-sm text-muted-foreground">
                Use this information when filling out App Store Connect&apos;s App Privacy section.
              </p>
            </div>

            {nutritionLabel ? (
              <div className="space-y-6">
                {/* Data Used to Track You */}
                <NutritionSection
                  title="Data Used to Track You"
                  description="Data may be used to track you across apps and websites owned by other companies"
                  items={nutritionLabel.dataUsedToTrackYou}
                  color="red"
                />

                {/* Data Linked to You */}
                <NutritionSection
                  title="Data Linked to You"
                  description="Data that is linked to your identity"
                  items={nutritionLabel.dataLinkedToYou}
                  color="orange"
                />

                {/* Data Not Linked to You */}
                <NutritionSection
                  title="Data Not Linked to You"
                  description="Data that is not linked to your identity"
                  items={nutritionLabel.dataNotLinkedToYou}
                  color="green"
                />

                {nutritionLabel.dataUsedToTrackYou.length === 0 &&
                  nutritionLabel.dataLinkedToYou.length === 0 &&
                  nutritionLabel.dataNotLinkedToYou.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="font-medium">No Data Collected</p>
                      <p className="text-sm mt-1">
                        This app does not collect any data from users.
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No nutrition label data available. Please complete the questionnaire.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function NutritionSection({
  title,
  description,
  items,
  color,
}: {
  title: string
  description: string
  items: Array<{ type: string; purposes: string[] }>
  color: 'red' | 'orange' | 'green'
}) {
  if (items.length === 0) return null

  const colorClasses = {
    red: 'bg-red-500/10 border-red-500/30 text-red-500',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
    green: 'bg-green-500/10 border-green-500/30 text-green-500',
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'px-4 py-3 rounded-lg border',
              colorClasses[color]
            )}
          >
            <div className="font-medium text-sm text-foreground">{item.type}</div>
            {item.purposes.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Purposes: {item.purposes.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
