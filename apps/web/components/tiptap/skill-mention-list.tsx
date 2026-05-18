'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'
import type { AISkill } from '@/lib/skills'

export interface SkillMentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface SkillMentionListProps {
  items: AISkill[]
  command: (item: AISkill) => void
}

export const SkillMentionList = forwardRef<SkillMentionListRef, SkillMentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command(item)
      }
    }

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length)
    }

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length)
    }

    const enterHandler = () => {
      selectItem(selectedIndex)
    }

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }

        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }

        if (event.key === 'Enter') {
          enterHandler()
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return null
    }

    return (
      <div className="w-80 max-h-80 overflow-y-auto bg-background border border-border rounded-lg shadow-lg z-50">
        <div className="p-2">
          <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
            Integrations
          </div>
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-950/30'
                    : 'hover:bg-muted'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-md',
                  index === selectedIndex
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'bg-muted'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }
)

SkillMentionList.displayName = 'SkillMentionList'
