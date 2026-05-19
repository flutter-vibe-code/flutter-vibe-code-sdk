'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { SkillMention } from './skill-mention-extension'
import { skillSuggestion } from './skill-suggestion'
import { useEffect, useImperativeHandle, forwardRef, useCallback, useState } from 'react'
import type { AISkill } from '@/lib/skills'
import { AI_SKILLS } from '@/lib/skills'
import './chat-editor.css'
import { Mention } from '@tiptap/extension-mention'
import type { SuggestionOptions } from '@tiptap/suggestion'

export interface ChatEditorRef {
  focus: () => void
  clearContent: () => void
  getPlainText: () => string
  getSelectedSkills: () => AISkill[]
  setContent: (content: string) => void
}

interface ChatEditorProps {
  placeholder?: string
  disabled?: boolean
  onContentChange?: (text: string, skills: AISkill[]) => void
  onSubmit?: () => void
  className?: string
  disableEnterSubmit?: boolean
}

export const ChatEditor = forwardRef<ChatEditorRef, ChatEditorProps>(
  ({ placeholder, disabled, onContentChange, onSubmit, className, disableEnterSubmit = false }, ref) => {
    const [isSuggestionActive, setIsSuggestionActive] = useState(false)

    // Create custom SkillMention with state tracking
    const CustomSkillMention = Mention.extend({
      name: 'skillMention',

      addOptions() {
        return {
          ...this.parent?.(),
          HTMLAttributes: {
            class: 'skill-mention',
          },
        }
      },

      addAttributes() {
        return {
          id: {
            default: null,
            parseHTML: element => element.getAttribute('data-id'),
            renderHTML: attributes => {
              if (!attributes.id) return {}
              return { 'data-id': attributes.id }
            },
          },
          label: {
            default: null,
            parseHTML: element => element.getAttribute('data-label'),
            renderHTML: attributes => {
              if (!attributes.label) return {}
              return { 'data-label': attributes.label }
            },
          },
          iconName: {
            default: null,
            parseHTML: element => element.getAttribute('data-icon'),
            renderHTML: attributes => {
              if (!attributes.iconName) return {}
              return { 'data-icon': attributes.iconName }
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
          {
            'data-type': this.name,
            'class': 'skill-mention',
            'data-id': node.attrs.id,
            'data-label': node.attrs.label,
            'data-icon': node.attrs.iconName,
            ...HTMLAttributes,
          },
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
        render: () => {
          const baseRender = skillSuggestion.render()
          return {
            onStart: (props: any) => {
              setIsSuggestionActive(true)
              baseRender.onStart?.(props)
            },
            onUpdate: (props: any) => {
              baseRender.onUpdate?.(props)
            },
            onKeyDown: (props: any) => {
              return baseRender.onKeyDown?.(props) ?? false
            },
            onExit: () => {
              setIsSuggestionActive(false)
              baseRender.onExit?.()
            },
          }
        },
      },
    })

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          // Disable features we don't need for chat input
          heading: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        Placeholder.configure({
          placeholder: placeholder || '',
          emptyEditorClass: 'is-editor-empty',
        }),
        CustomSkillMention,
      ],
      editorProps: {
        attributes: {
          class: 'chat-editor-content focus:outline-none',
        },
        handleKeyDown: (view, event) => {
          // Handle Enter to submit (Shift+Enter for new line)
          // But only if suggestion popup is not active and Enter submit is enabled
          if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey && !isSuggestionActive && !disableEnterSubmit) {
            event.preventDefault()
            onSubmit?.()
            return true
          }
          return false
        },
      },
      editable: !disabled,
      onUpdate: ({ editor }) => {
        const text = getPlainTextFromEditor(editor)
        const skills = getSkillsFromEditor(editor)
        onContentChange?.(text, skills)
      },
    })

    // Extract plain text with skill mention markers for inline rendering
    const getPlainTextFromEditor = useCallback((editorInstance: typeof editor) => {
      if (!editorInstance) return ''

      let text = ''
      editorInstance.state.doc.descendants((node) => {
        if (node.isText) {
          text += node.text
        } else if (node.type.name === 'skillMention' && node.attrs.id) {
          // Include a marker for skill mentions that can be parsed later
          text += `{{skill:${node.attrs.id}}}`
        } else if (node.type.name === 'paragraph') {
          if (text.length > 0) text += '\n'
        }
      })
      return text.trim()
    }, [])

    // Extract selected skills from editor content
    const getSkillsFromEditor = useCallback((editorInstance: typeof editor): AISkill[] => {
      if (!editorInstance) return []

      const skillIds: string[] = []
      editorInstance.state.doc.descendants((node) => {
        if (node.type.name === 'skillMention' && node.attrs.id) {
          skillIds.push(node.attrs.id)
        }
      })

      return skillIds
        .map(id => AI_SKILLS.find(s => s.id === id))
        .filter((s): s is AISkill => s !== undefined)
    }, [])

    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.commands.focus()
      },
      clearContent: () => {
        editor?.commands.clearContent()
      },
      getPlainText: () => {
        return getPlainTextFromEditor(editor)
      },
      getSelectedSkills: () => {
        return getSkillsFromEditor(editor)
      },
      setContent: (content: string) => {
        editor?.commands.setContent(content)
      }
    }), [editor, getPlainTextFromEditor, getSkillsFromEditor])

    // Update placeholder when prop changes
    useEffect(() => {
      if (editor && placeholder) {
        editor.extensionManager.extensions.forEach(ext => {
          if (ext.name === 'placeholder') {
            (ext.options as any).placeholder = placeholder
          }
        })
        // Force re-render
        editor.view.dispatch(editor.state.tr)
      }
    }, [editor, placeholder])

    // Update editable state
    useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled)
      }
    }, [editor, disabled])

    if (!editor) {
      return null
    }

    return (
      <EditorContent
        editor={editor}
        className={className}
      />
    )
  }
)

ChatEditor.displayName = 'ChatEditor'
