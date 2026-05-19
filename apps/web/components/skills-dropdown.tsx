'use client'

import { useEffect, useRef, useState } from 'react'
import { AI_SKILLS, type AISkill } from '@/lib/skills'
import { cn } from '@/lib/utils'

interface SkillsDropdownProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (skill: AISkill) => void
  filterText?: string
  selectedSkillIds?: string[]
}

export function SkillsDropdown({
  isOpen,
  onClose,
  onSelect,
  filterText = '',
  selectedSkillIds = [],
}: SkillsDropdownProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter skills based on text and exclude already selected
  const filteredSkills = AI_SKILLS.filter(skill => {
    const matchesFilter = filterText === '' ||
      skill.name.toLowerCase().includes(filterText.toLowerCase()) ||
      skill.description.toLowerCase().includes(filterText.toLowerCase())
    const notSelected = !selectedSkillIds.includes(skill.id)
    return matchesFilter && notSelected
  })

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filterText])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev < filteredSkills.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredSkills[highlightedIndex]) {
            onSelect(filteredSkills[highlightedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, filteredSkills, onSelect, onClose])

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen || filteredSkills.length === 0) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full left-0 mb-2 w-80 max-h-80 overflow-y-auto bg-background border border-border rounded-lg shadow-lg z-50"
    >
      <div className="p-2">
        <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
          Integrations
        </div>
        {filteredSkills.map((skill, index) => {
          const Icon = skill.icon
          return (
            <button
              key={skill.id}
              onClick={() => onSelect(skill)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                index === highlightedIndex
                  ? 'bg-blue-50 dark:bg-blue-950/30'
                  : 'hover:bg-muted'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md',
                index === highlightedIndex
                  ? 'bg-blue-100 dark:bg-blue-900/50'
                  : 'bg-muted'
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{skill.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {skill.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
