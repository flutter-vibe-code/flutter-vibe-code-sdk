'use client'

import { Loader2, FileText, Terminal, Search, CheckCircle2, XCircle } from 'lucide-react'
import type { ActiveToolExecution } from '@/hooks/useAgentToolStream'

interface AgentToolIndicatorProps {
  activeTools: ActiveToolExecution[]
}

function getToolIcon(toolName: string) {
  switch (toolName) {
    case 'Write':
    case 'Edit':
    case 'Read':
      return <FileText className="w-3.5 h-3.5" />
    case 'Bash':
      return <Terminal className="w-3.5 h-3.5" />
    case 'Glob':
    case 'Grep':
      return <Search className="w-3.5 h-3.5" />
    default:
      return <Terminal className="w-3.5 h-3.5" />
  }
}

function getToolLabel(tool: ActiveToolExecution): string {
  switch (tool.toolName) {
    case 'Write':
      return tool.filePath ? `Creando ${tool.filePath}` : 'Creando archivo...'
    case 'Edit':
      return tool.filePath ? `Editando ${tool.filePath}` : 'Editando archivo...'
    case 'Read':
      return tool.filePath ? `Leyendo ${tool.filePath}` : 'Leyendo archivo...'
    case 'Bash':
      return tool.commandPreview
        ? `Ejecutando: ${tool.commandPreview.slice(0, 60)}${tool.commandPreview.length > 60 ? '...' : ''}`
        : 'Ejecutando comando...'
    case 'Glob':
      return tool.pattern ? `Buscando archivos: ${tool.pattern}` : 'Buscando archivos...'
    case 'Grep':
      return tool.pattern ? `Buscando texto: ${tool.pattern}` : 'Buscando texto...'
    default:
      return `Usando herramienta: ${tool.toolName}`
  }
}

export function AgentToolIndicator({ activeTools }: AgentToolIndicatorProps) {
  if (!activeTools || activeTools.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 px-4 py-2">
      {activeTools.map((tool) => (
        <div
          key={tool.id}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            tool.status === 'running'
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              : tool.status === 'success'
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          {tool.status === 'running' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : tool.status === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          {getToolIcon(tool.toolName)}
          <span className="truncate">{getToolLabel(tool)}</span>
        </div>
      ))}
    </div>
  )
}
