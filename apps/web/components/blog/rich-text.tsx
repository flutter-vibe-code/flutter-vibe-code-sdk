'use client'

import React from 'react'
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

type Props = {
  content: SerializedEditorState | null | undefined
}

type SerializedNode = SerializedLexicalNode & {
  children?: SerializedNode[]
  text?: string
  format?: number
  tag?: string
  listType?: string
  url?: string
  relationTo?: string
  value?: any
}

const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_STRIKETHROUGH = 4
const FORMAT_UNDERLINE = 8
const FORMAT_CODE = 16

function renderText(text: string, format: number = 0): React.ReactNode {
  let result: React.ReactNode = text

  if (format & FORMAT_CODE) {
    result = <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{result}</code>
  }
  if (format & FORMAT_BOLD) {
    result = <strong>{result}</strong>
  }
  if (format & FORMAT_ITALIC) {
    result = <em>{result}</em>
  }
  if (format & FORMAT_UNDERLINE) {
    result = <u>{result}</u>
  }
  if (format & FORMAT_STRIKETHROUGH) {
    result = <s>{result}</s>
  }

  return result
}

function renderNode(node: SerializedNode, index: number): React.ReactNode {
  const key = `node-${index}`

  switch (node.type) {
    case 'root':
      return (
        <div key={key}>
          {node.children?.map((child, i) => renderNode(child, i))}
        </div>
      )

    case 'paragraph':
      return (
        <p key={key}>
          {node.children?.map((child, i) => renderNode(child, i))}
        </p>
      )

    case 'heading':
      const HeadingTag = (node.tag || 'h2') as keyof JSX.IntrinsicElements
      return (
        <HeadingTag key={key}>
          {node.children?.map((child, i) => renderNode(child, i))}
        </HeadingTag>
      )

    case 'text':
      return <React.Fragment key={key}>{renderText(node.text || '', node.format)}</React.Fragment>

    case 'link':
      return (
        <a key={key} href={node.url} className="text-blue-600 hover:underline">
          {node.children?.map((child, i) => renderNode(child, i))}
        </a>
      )

    case 'list':
      const ListTag = node.listType === 'number' ? 'ol' : 'ul'
      return (
        <ListTag key={key}>
          {node.children?.map((child, i) => renderNode(child, i))}
        </ListTag>
      )

    case 'listitem':
      return (
        <li key={key}>
          {node.children?.map((child, i) => renderNode(child, i))}
        </li>
      )

    case 'quote':
      return (
        <blockquote key={key} className="border-l-4 border-gray-300 pl-4 italic">
          {node.children?.map((child, i) => renderNode(child, i))}
        </blockquote>
      )

    case 'code':
      return (
        <pre key={key} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>
            {node.children?.map((child, i) => renderNode(child, i))}
          </code>
        </pre>
      )

    case 'linebreak':
      return <br key={key} />

    case 'upload':
      if (node.relationTo === 'media' && node.value) {
        return (
          <figure key={key} className="my-8">
            <img
              src={node.value.url}
              alt={node.value.alt || ''}
              className="rounded-lg w-full"
            />
            {node.value.alt && (
              <figcaption className="text-sm text-gray-500 mt-2 text-center">
                {node.value.alt}
              </figcaption>
            )}
          </figure>
        )
      }
      return null

    default:
      // For unknown node types, try to render children
      if (node.children) {
        return (
          <div key={key}>
            {node.children.map((child, i) => renderNode(child, i))}
          </div>
        )
      }
      return null
  }
}

export function RichText({ content }: Props) {
  if (!content || !content.root) {
    return null
  }

  return <div className="rich-text">{renderNode(content.root as SerializedNode, 0)}</div>
}
