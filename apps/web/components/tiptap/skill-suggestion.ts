import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { SkillMentionList, type SkillMentionListRef } from './skill-mention-list'
import { AI_SKILLS, type AISkill } from '@/lib/skills'
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'

export const skillSuggestion: Omit<SuggestionOptions<AISkill>, 'editor'> = {
  char: '/',
  allowSpaces: false,
  startOfLine: false,

  items: ({ query }): AISkill[] => {
    return AI_SKILLS.filter(skill =>
      skill.name.toLowerCase().includes(query.toLowerCase()) ||
      skill.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10)
  },

  render: () => {
    let component: ReactRenderer<SkillMentionListRef> | null = null
    let popup: TippyInstance[] | null = null

    return {
      onStart: (props: SuggestionProps<AISkill>) => {
        component = new ReactRenderer(SkillMentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate: (props: SuggestionProps<AISkill>) => {
        component?.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },

      onKeyDown: (props: { event: KeyboardEvent }): boolean => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide()
          return true
        }

        return component?.ref?.onKeyDown(props) ?? false
      },

      onExit: () => {
        popup?.[0]?.destroy()
        component?.destroy()
      },
    }
  },
}
