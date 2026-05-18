import { Mention } from '@tiptap/extension-mention'
import { skillSuggestion } from './skill-suggestion'
import type { AISkill } from '@/lib/skills'
import { mergeAttributes } from '@tiptap/react'

export interface SkillMentionOptions {
  HTMLAttributes: Record<string, any>
  onSkillSelected?: (skill: AISkill) => void
}

export const SkillMention = Mention.extend<SkillMentionOptions>({
  name: 'skillMention',

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: 'skill-mention',
      },
      onSkillSelected: undefined,
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }
          return {
            'data-id': attributes.id,
          }
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }
          return {
            'data-label': attributes.label,
          }
        },
      },
      iconName: {
        default: null,
        parseHTML: element => element.getAttribute('data-icon'),
        renderHTML: attributes => {
          if (!attributes.iconName) {
            return {}
          }
          return {
            'data-icon': attributes.iconName,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': this.name },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      `${node.attrs.label}`,
    ]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false
          const { selection } = state
          const { empty, anchor } = selection

          if (!empty) {
            return false
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true
              tr.insertText('', pos, pos + node.nodeSize)
              return false
            }
          })

          return isMention
        }),
    }
  },
}).configure({
  suggestion: {
    ...skillSuggestion,
    command: ({ editor, range, props }) => {
      // Insert the skill mention node
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'skillMention',
            attrs: {
              id: props.id,
              label: props.name,
              iconName: props.iconName,
            },
          },
          {
            type: 'text',
            text: ' ',
          },
        ])
        .run()

      // Notify parent about skill selection via custom event
      window.dispatchEvent(new CustomEvent('skill-selected', { detail: props }))
    },
  },
})
