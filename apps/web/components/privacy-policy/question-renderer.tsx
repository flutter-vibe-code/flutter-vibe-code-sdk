'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Question, QuestionField, PolicyAnswers } from '@/lib/privacy-policy/types'
import { DATA_PURPOSES } from '@/lib/privacy-policy/questions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface QuestionRendererProps {
  question: Question
  answers: PolicyAnswers
  onAnswerChange: (key: string, value: unknown) => void
}

export function QuestionRenderer({ question, answers, onAnswerChange }: QuestionRendererProps) {
  switch (question.type) {
    case 'object':
      return (
        <ObjectFields
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
        />
      )
    case 'boolean':
      return (
        <BooleanQuestion
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
        />
      )
    case 'boolean_with_details':
      return (
        <BooleanWithDetails
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
        />
      )
    case 'multi_select':
      return (
        <MultiSelect
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
        />
      )
    case 'multi_select_with_subquestions':
      return (
        <MultiSelectWithSubquestions
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
        />
      )
    case 'textarea':
      return (
        <TextareaQuestion
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
        />
      )
    case 'list_of_objects':
    case 'same_as_above':
      return (
        <ListOfObjects
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
        />
      )
    default:
      return <div>Unknown question type</div>
  }
}

function ObjectFields({ question, answers, onAnswerChange }: QuestionRendererProps) {
  return (
    <div className="space-y-4">
      {question.fields?.map((field: QuestionField) => (
        <div key={field.key}>
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.type === 'textarea' ? (
            <Textarea
              id={field.key}
              value={(answers[field.key as keyof PolicyAnswers] as string) || ''}
              onChange={(e) => onAnswerChange(field.key, e.target.value)}
              className="mt-1"
              rows={3}
            />
          ) : (
            <Input
              id={field.key}
              type={field.type === 'text' ? 'text' : 'text'}
              value={(answers[field.key as keyof PolicyAnswers] as string) || ''}
              onChange={(e) => onAnswerChange(field.key, e.target.value)}
              className="mt-1"
            />
          )}
        </div>
      ))}
    </div>
  )
}

function BooleanQuestion({ question, answers, onAnswerChange }: QuestionRendererProps) {
  const key = question.id.replace('q_', '')
  const value = answers[key as keyof PolicyAnswers]

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button
          type="button"
          variant={value === true ? 'default' : 'outline'}
          onClick={() => onAnswerChange(key, true)}
          className={cn(
            'flex-1',
            value === true && 'bg-purple-600 hover:bg-purple-700'
          )}
        >
          Yes
        </Button>
        <Button
          type="button"
          variant={value === false ? 'default' : 'outline'}
          onClick={() => onAnswerChange(key, false)}
          className={cn(
            'flex-1',
            value === false && 'bg-purple-600 hover:bg-purple-700'
          )}
        >
          No
        </Button>
      </div>
    </div>
  )
}

function BooleanWithDetails({ question, answers, onAnswerChange }: QuestionRendererProps) {
  const key = question.id.replace('q_', '')
  const value = answers[key as keyof PolicyAnswers]
  const detailsKey = `${key}_details`
  const detailsValue = answers[detailsKey as keyof PolicyAnswers] as string

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button
          type="button"
          variant={value === true ? 'default' : 'outline'}
          onClick={() => onAnswerChange(key, true)}
          className={cn(
            'flex-1',
            value === true && 'bg-purple-600 hover:bg-purple-700'
          )}
        >
          Yes
        </Button>
        <Button
          type="button"
          variant={value === false ? 'default' : 'outline'}
          onClick={() => onAnswerChange(key, false)}
          className={cn(
            'flex-1',
            value === false && 'bg-purple-600 hover:bg-purple-700'
          )}
        >
          No
        </Button>
      </div>
      {value === true && question.details_if_yes && (
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            {question.details_if_yes}
          </Label>
          <Textarea
            value={detailsValue || ''}
            onChange={(e) => onAnswerChange(detailsKey, e.target.value)}
            rows={3}
          />
        </div>
      )}
    </div>
  )
}

function MultiSelect({ question, answers, onAnswerChange }: QuestionRendererProps) {
  const key = question.id.replace('q_', '')
  const selected = (answers[key as keyof PolicyAnswers] as string[]) || []
  const options = question.options as string[]

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onAnswerChange(key, selected.filter((o) => o !== option))
    } else {
      onAnswerChange(key, [...selected, option])
    }
  }

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <div
          key={option}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
            selected.includes(option)
              ? 'bg-purple-500/10 border-purple-500/30'
              : 'bg-muted-foreground/5 border-transparent hover:bg-muted-foreground/10'
          )}
          onClick={() => toggleOption(option)}
        >
          <Checkbox
            checked={selected.includes(option)}
            onCheckedChange={() => toggleOption(option)}
          />
          <span className="text-sm">{option}</span>
        </div>
      ))}
    </div>
  )
}

function MultiSelectWithSubquestions({ question, answers, onAnswerChange }: QuestionRendererProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const selected = (answers.data_categories as string[]) || []
  const categoryDetails = (answers.data_category_details as Record<string, {
    linked_to_identity?: boolean
    used_for_tracking?: boolean
    purposes?: string[]
  }>) || {}
  const options = question.options as string[]

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      const newSelected = selected.filter((c) => c !== category)
      onAnswerChange('data_categories', newSelected)
      // Remove details for this category
      const newDetails = { ...categoryDetails }
      delete newDetails[category]
      onAnswerChange('data_category_details', newDetails)
      setExpandedCategories(expandedCategories.filter((c) => c !== category))
    } else {
      onAnswerChange('data_categories', [...selected, category])
      setExpandedCategories([...expandedCategories, category])
    }
  }

  const toggleExpand = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter((c) => c !== category))
    } else {
      setExpandedCategories([...expandedCategories, category])
    }
  }

  const updateCategoryDetail = (
    category: string,
    key: 'linked_to_identity' | 'used_for_tracking' | 'purposes',
    value: boolean | string[]
  ) => {
    const newDetails = {
      ...categoryDetails,
      [category]: {
        ...categoryDetails[category],
        [key]: value,
      },
    }
    onAnswerChange('data_category_details', newDetails)
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {options.map((category) => {
        const isSelected = selected.includes(category)
        const isExpanded = expandedCategories.includes(category)
        const details = categoryDetails[category] || {}

        return (
          <div
            key={category}
            className={cn(
              'rounded-lg border transition-colors',
              isSelected
                ? 'bg-purple-500/10 border-purple-500/30'
                : 'bg-muted-foreground/5 border-transparent'
            )}
          >
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => toggleCategory(category)}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleCategory(category)}
              />
              <span className="text-sm flex-1">{category}</span>
              {isSelected && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(category)
                  }}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>

            {isSelected && isExpanded && (
              <div className="px-3 pb-3 pt-1 space-y-3 border-t border-purple-500/20 ml-9">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${category}-linked`}
                    checked={details.linked_to_identity || false}
                    onCheckedChange={(checked) =>
                      updateCategoryDetail(category, 'linked_to_identity', !!checked)
                    }
                  />
                  <Label htmlFor={`${category}-linked`} className="text-xs">
                    Linked to user identity
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${category}-tracking`}
                    checked={details.used_for_tracking || false}
                    onCheckedChange={(checked) =>
                      updateCategoryDetail(category, 'used_for_tracking', !!checked)
                    }
                  />
                  <Label htmlFor={`${category}-tracking`} className="text-xs">
                    Used for tracking
                  </Label>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Purposes:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DATA_PURPOSES.map((purpose) => (
                      <button
                        key={purpose}
                        type="button"
                        onClick={() => {
                          const currentPurposes = details.purposes || []
                          if (currentPurposes.includes(purpose)) {
                            updateCategoryDetail(
                              category,
                              'purposes',
                              currentPurposes.filter((p) => p !== purpose)
                            )
                          } else {
                            updateCategoryDetail(category, 'purposes', [
                              ...currentPurposes,
                              purpose,
                            ])
                          }
                        }}
                        className={cn(
                          'px-2 py-1 rounded text-xs transition-colors',
                          (details.purposes || []).includes(purpose)
                            ? 'bg-purple-500 text-white'
                            : 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20'
                        )}
                      >
                        {purpose}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TextareaQuestion({ question, answers, onAnswerChange }: QuestionRendererProps) {
  const key = question.id.replace('q_', '')
  const value = (answers[key as keyof PolicyAnswers] as string) || ''

  return (
    <Textarea
      value={value}
      onChange={(e) => onAnswerChange(key, e.target.value)}
      rows={4}
      placeholder="Enter your answer..."
    />
  )
}

interface ThirdParty {
  name: string
  purpose: string
  data_shared: string
  policy_link: string
  ai_related?: boolean
}

function ListOfObjects({ question, answers, onAnswerChange }: QuestionRendererProps) {
  const items = (answers.third_parties as ThirdParty[]) || []

  const addItem = () => {
    onAnswerChange('third_parties', [
      ...items,
      { name: '', purpose: '', data_shared: '', policy_link: '', ai_related: false },
    ])
  }

  const removeItem = (index: number) => {
    onAnswerChange(
      'third_parties',
      items.filter((_, i) => i !== index)
    )
  }

  const updateItem = (index: number, field: string, value: string | boolean) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onAnswerChange('third_parties', newItems)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-border/50 bg-muted-foreground/5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Service #{index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {question.fields?.map((field: QuestionField) => (
            <div key={field.key}>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                {field.label}
                {field.key === 'data_shared' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground/70 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        <p className="text-xs">
                          List the types of user data shared with this service (e.g., Email, Device ID, Usage Data, Location).
                          This helps Apple determine your app&apos;s privacy nutrition label.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </Label>
              {field.type === 'boolean' ? (
                <div className="flex items-center gap-2 mt-1">
                  <Checkbox
                    checked={item[field.key as keyof ThirdParty] as boolean || false}
                    onCheckedChange={(checked) =>
                      updateItem(index, field.key, !!checked)
                    }
                  />
                  <span className="text-sm">Yes</span>
                </div>
              ) : (
                <Input
                  value={(item[field.key as keyof ThirdParty] as string) || ''}
                  onChange={(e) => updateItem(index, field.key, e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Third-Party Service
      </Button>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No third-party services added. Click above to add one, or continue if none apply.
        </p>
      )}
    </div>
  )
}
