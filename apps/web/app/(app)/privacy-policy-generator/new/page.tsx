'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import { questions, QUESTION_ORDER, getNextQuestion } from '@/lib/privacy-policy/questions'
import { QuestionId, PolicyAnswers } from '@/lib/privacy-policy/types'
import { QuestionRenderer } from '@/components/privacy-policy/question-renderer'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function NewPolicyPage() {
  return (
    <Suspense fallback={
      <div className="py-12 md:py-20">
        <div className="max-w-2xl mx-auto px-4 md:px-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <NewPolicyContent />
    </Suspense>
  )
}

function NewPolicyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { data: session, isPending: isSessionLoading } = useSession()

  const [policyId, setPolicyId] = useState<string | null>(editId)
  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId>('q_app_info')
  const [answers, setAnswers] = useState<PolicyAnswers>({})
  const [isLoading, setIsLoading] = useState(!!editId)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push('/privacy-policy-generator')
    }
  }, [session, isSessionLoading, router])

  // Load existing policy if editing
  useEffect(() => {
    if (editId && session) {
      loadPolicy(editId)
    }
  }, [editId, session])

  const loadPolicy = async (id: string) => {
    try {
      const response = await fetch(`/api/privacy-policies/${id}`)
      if (response.ok) {
        const data = await response.json()
        setAnswers(data.policy.answers as PolicyAnswers || {})
        setPolicyId(id)
      } else {
        toast.error('Failed to load policy')
        router.push('/privacy-policy-generator/dashboard')
      }
    } catch (error) {
      console.error('Error loading policy:', error)
      toast.error('Failed to load policy')
    } finally {
      setIsLoading(false)
    }
  }

  const saveProgress = useCallback(async (newAnswers: PolicyAnswers, complete = false) => {
    if (!session) return

    setIsSaving(true)
    try {
      const appName = newAnswers.app_name || 'Untitled Policy'
      const companyName = newAnswers.company_name

      if (policyId) {
        // Update existing policy
        await fetch(`/api/privacy-policies/${policyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appName,
            companyName,
            answers: newAnswers,
            status: complete ? 'completed' : 'draft',
          }),
        })
      } else {
        // Create new policy
        const response = await fetch('/api/privacy-policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appName,
            companyName,
            answers: newAnswers,
            status: complete ? 'completed' : 'draft',
          }),
        })
        if (response.ok) {
          const data = await response.json()
          setPolicyId(data.policy.id)
        }
      }
    } catch (error) {
      console.error('Error saving policy:', error)
    } finally {
      setIsSaving(false)
    }
  }, [policyId, session])

  const handleAnswerChange = (key: string, value: unknown) => {
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)
  }

  const handleNext = async () => {
    // Save progress before moving to next question
    await saveProgress(answers)

    const nextId = getNextQuestion(currentQuestionId, answers)
    if (nextId === 'end') {
      handleComplete()
    } else {
      setCurrentQuestionId(nextId)
    }
  }

  const handlePrevious = () => {
    const currentIndex = QUESTION_ORDER.indexOf(currentQuestionId)
    if (currentIndex > 0) {
      setCurrentQuestionId(QUESTION_ORDER[currentIndex - 1])
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    await saveProgress(answers, true)
    toast.success('Privacy policy generated!')
    router.push(`/privacy-policy-generator/${policyId}`)
  }

  const currentQuestion = questions[currentQuestionId]
  const currentIndex = QUESTION_ORDER.indexOf(currentQuestionId)
  const progress = ((currentIndex + 1) / QUESTION_ORDER.length) * 100
  const isFirstQuestion = currentIndex === 0
  const nextId = getNextQuestion(currentQuestionId, answers)
  const isLastQuestion = nextId === 'end'

  // Check if current question has required fields that are empty
  const canProceed = () => {
    if (currentQuestion.type === 'object' && currentQuestion.fields) {
      for (const field of currentQuestion.fields) {
        if (field.required) {
          const value = answers[field.key as keyof PolicyAnswers]
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            return false
          }
        }
      }
    }
    return true
  }

  if (isSessionLoading || !session || isLoading) {
    return (
      <div className="py-12 md:py-20">
        <div className="max-w-2xl mx-auto px-4 md:px-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentIndex + 1} of {QUESTION_ORDER.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-muted-foreground/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-6">
            {currentQuestion.text}
          </h2>

          <QuestionRenderer
            question={currentQuestion}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstQuestion || isSaving}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Save className="w-3 h-3" />
                Saving...
              </span>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSaving || isCompleting}
            className={cn(
              isLastQuestion
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-purple-600 hover:bg-purple-700',
              'text-white'
            )}
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : isLastQuestion ? (
              'Generate Policy'
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Save & Exit Option */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => {
              saveProgress(answers)
              router.push('/privacy-policy-generator/dashboard')
            }}
            disabled={isSaving}
            className="text-muted-foreground"
          >
            Save & Exit
          </Button>
        </div>
      </div>
    </div>
  )
}
