'use client'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useKeyboardShortcuts } from '@/context/keyboard-shortcuts-context'
import { useViewMode } from '@/context/view-mode-context'
import { MousePointerClick, Type, Mic, Search, FileCode, Folder, FileText, Monitor, Smartphone, MonitorSmartphone } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { searchService } from '@/lib/search-service'
import type { SearchResult } from '@/lib/file-cache'

interface FileItem {
  name: string
  type: string
  path: string
  children?: FileItem[]
}

export function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [searchMode, setSearchMode] = React.useState<'commands' | 'files' | 'content-search'>('commands')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [fileStructure, setFileStructure] = React.useState<FileItem[]>([])
  const [filteredFiles, setFilteredFiles] = React.useState<FileItem[]>([])
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [projectId, setProjectId] = React.useState<string | null>(null)
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts()
  const { viewMode, toggleViewMode } = useViewMode()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
        if (!open) {
          // Reset to commands mode when opening
          setSearchMode('commands')
          setSearchQuery('')
        }
      } else if (e.key === 'v' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        toggleViewMode()
      } else if (e.key === 'e' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
        setSearchMode('files')
        setSearchQuery('')
        // Focus the input after a short delay
        setTimeout(() => {
          const input = document.querySelector('[cmdk-input]') as HTMLInputElement
          if (input) {
            input.focus()
          }
        }, 100)
      } else if (e.key === 'f' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        setOpen(true)
        setSearchMode('content-search')
        setSearchQuery('')
        setSearchResults([])
        // Focus the input after a short delay
        setTimeout(() => {
          const input = document.querySelector('[cmdk-input]') as HTMLInputElement
          if (input) {
            input.focus()
          }
        }, 100)
      } else if (e.key === 'Escape' && open && (searchMode === 'files' || searchMode === 'content-search')) {
        e.preventDefault()
        e.stopPropagation()
        setSearchMode('commands')
        setSearchQuery('')
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, searchMode, toggleViewMode])

  // Get project ID from window or storage
  React.useEffect(() => {
    // Try to get project ID from window object or find it from the UI
    const getProjectId = () => {
      // Check if there's a global project ID
      const globalProjectId = (window as any).__currentProjectId
      if (globalProjectId) return globalProjectId

      // Try to extract from URL or other sources
      const urlParams = new URLSearchParams(window.location.search)
      const urlProjectId = urlParams.get('projectId')
      if (urlProjectId) return urlProjectId

      // Try to get from localStorage
      const storedProjectId = localStorage.getItem('currentProjectId')
      if (storedProjectId) return storedProjectId

      return null
    }

    const id = getProjectId()
    setProjectId(id)
  }, [open])

  // Fetch file structure when in file search mode
  React.useEffect(() => {
    if (searchMode === 'files' && projectId && open) {
      fetchFileStructure()
    }
  }, [searchMode, projectId, open])

  // Filter files based on search query
  React.useEffect(() => {
    if (searchMode === 'files' && searchQuery) {
      const flattened = flattenFileStructure(fileStructure)
      const filtered = flattened.filter(file => {
        // Fuzzy match: check if all characters in query appear in order
        const query = searchQuery.toLowerCase()
        const fileName = file.name.toLowerCase()
        const filePath = file.path.toLowerCase()
        
        // Check both file name and full path
        return fuzzyMatch(query, fileName) || fuzzyMatch(query, filePath)
      })
      setFilteredFiles(filtered)
    } else {
      setFilteredFiles(flattenFileStructure(fileStructure))
    }
  }, [searchQuery, fileStructure, searchMode])

  // Debounced content search
  React.useEffect(() => {
    if (searchMode === 'content-search' && searchQuery.trim() && projectId) {
      setIsSearching(true)
      const timeoutId = setTimeout(async () => {
        try {
          const results = await searchService.searchInProject(projectId, searchQuery, {
            maxResults: 100,
            contextLines: 1,
          })
          setSearchResults(results)
        } catch (error) {
          console.error('Content search error:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, 300) // 300ms debounce

      return () => clearTimeout(timeoutId)
    } else if (searchMode === 'content-search') {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery, searchMode, projectId])

  // Fuzzy match function
  const fuzzyMatch = (query: string, text: string): boolean => {
    let queryIndex = 0
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        queryIndex++
      }
    }
    return queryIndex === query.length
  }

  // Flatten file structure for easier searching
  const flattenFileStructure = (items: FileItem[], result: FileItem[] = []): FileItem[] => {
    for (const item of items) {
      if (item.type !== 'folder') {
        result.push(item)
      }
      if (item.children) {
        flattenFileStructure(item.children, result)
      }
    }
    return result
  }

  // Fetch file structure from API
  const fetchFileStructure = async () => {
    if (!projectId) return

    try {
      const response = await fetch('/api/sandbox-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          action: 'structure',
        }),
      })

      if (!response.ok) {
        console.error('Failed to fetch file structure')
        return
      }

      const data = await response.json()
      if (data.structure && data.structure.length > 0) {
        // Build hierarchical structure from flat list
        const hierarchical = buildHierarchicalStructure(data.structure)
        setFileStructure(hierarchical)
      }
    } catch (error) {
      console.error('Error fetching file structure:', error)
    }
  }

  // Build hierarchical structure from flat file list
  const buildHierarchicalStructure = (flatFiles: FileItem[]): FileItem[] => {
    const root: { [key: string]: any } = {}
    
    flatFiles.forEach(file => {
      const parts = file.path.split('/').filter(p => p !== '')
      let currentLevel = root
      let currentPath = ''
      
      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        
        if (index === parts.length - 1) {
          currentLevel[part] = {
            name: part,
            type: file.type,
            path: file.path,
          }
        } else {
          if (!currentLevel[part]) {
            currentLevel[part] = {
              name: part,
              type: 'folder',
              path: currentPath,
              children: {},
            }
          }
          currentLevel = currentLevel[part].children
        }
      })
    })
    
    const convertToArray = (obj: any): FileItem[] => {
      return Object.entries(obj).map(([name, item]) => {
        const fileItem = item as FileItem
        if (fileItem.children) {
          fileItem.children = convertToArray(fileItem.children)
        }
        return fileItem
      }).sort((a: FileItem, b: FileItem) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1
        if (a.type !== 'folder' && b.type === 'folder') return 1
        return a.name.localeCompare(b.name)
      })
    }
    
    return convertToArray(root)
  }

  const handleSearchFiles = React.useCallback(() => {
    setSearchMode('files')
    setSearchQuery('')
  }, [])

  const handleSearchContent = React.useCallback(() => {
    setSearchMode('content-search')
    setSearchQuery('')
    setSearchResults([])
  }, [])

  const handleSelectFile = React.useCallback((filePath: string) => {
    setOpen(false)
    
    // Use setTimeout to ensure the dialog is fully closed
    setTimeout(() => {
      // Trigger file selection in code panel
      const callback = (window as any).__selectFileCallback
      if (callback) {
        callback(filePath)
      } else {
        // Fallback: Try to find and trigger the file selection directly
        const event = new CustomEvent('selectFile', { detail: { filePath } })
        window.dispatchEvent(event)
      }
    }, 100)
  }, [])

  const handleSelectSearchResult = React.useCallback((result: SearchResult) => {
    setOpen(false)
    
    // Use setTimeout to ensure the dialog is fully closed
    setTimeout(() => {
      // Trigger file selection with positioning information
      const fileSelectCallback = (window as any).__selectFileCallback
      if (fileSelectCallback) {
        // Pass all positioning info to the callback
        fileSelectCallback(result.filePath, result.lineNumber, result.columnStart, result.columnEnd)
      } else {
        // Fallback: Try to find and trigger the file selection directly
        const event = new CustomEvent('selectFile', { 
          detail: { 
            filePath: result.filePath,
            lineNumber: result.lineNumber,
            columnStart: result.columnStart,
            columnEnd: result.columnEnd
          } 
        })
        window.dispatchEvent(event)
      }
    }, 100)
  }, [])

  const handleFocusInput = React.useCallback(() => {
    setOpen(false)

    // Use setTimeout to ensure the dialog is fully closed before focusing
    setTimeout(() => {
      // 1. Try the global callback first
      const callback = (window as any).__focusInputCallback
      if (callback) {
        callback()
        return
      }

      // 2. Try to find and focus the textarea directly
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
        return
      }

    }, 100)
  }, [])

  const handleToggleEdit = React.useCallback(() => {
    setOpen(false)
    // Trigger the registered toggle-edit shortcut
    const callback = (window as any).__toggleEditCallback
    if (callback) {
      callback()
    }
  }, [])

  const handleToggleRecording = React.useCallback(() => {
    setOpen(false)

    // Use setTimeout to ensure the dialog is fully closed before toggling recording
    setTimeout(() => {
      const callback = (window as any).__toggleRecordingCallback
      if (callback) {
        callback()
      } else {
      }
    }, 100)
  }, [])

  const handleToggleView = React.useCallback(() => {
    setOpen(false)
    toggleViewMode()
  }, [toggleViewMode])

  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'mobile':
        return <Smartphone className="mr-2 h-4 w-4" />
      case 'desktop':
        return <Monitor className="mr-2 h-4 w-4" />
      case 'both':
        return <MonitorSmartphone className="mr-2 h-4 w-4" />
      default:
        return <Smartphone className="mr-2 h-4 w-4" />
    }
  }

  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'mobile':
        return 'Toggle View Mode (Mobile → Desktop)'
      case 'desktop':
        return 'Toggle View Mode (Desktop → Both)'
      case 'both':
        return 'Toggle View Mode (Both → Mobile)'
      default:
        return 'Toggle View Mode'
    }
  }

  // Register a global callback for toggle-edit
  React.useEffect(() => {
    const toggleEdit = () => {
      // Find and click the edit button
      const editButton = document.querySelector(
        'button[title*="hover inspector"]',
      ) as HTMLButtonElement
      if (editButton && !editButton.disabled) {
        editButton.click()
      }
    }
    registerShortcut('toggle-edit', toggleEdit)
    ;(window as any).__toggleEditCallback = toggleEdit

    return () => {
      unregisterShortcut('toggle-edit')
      delete (window as any).__toggleEditCallback
    }
  }, [registerShortcut, unregisterShortcut])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Palette</DialogTitle>
      <DialogDescription className="sr-only">
        Search and execute commands
      </DialogDescription>
      <CommandInput 
        placeholder={
          searchMode === 'files' 
            ? 'Search files by name...' 
            : searchMode === 'content-search'
            ? 'Search in file contents...'
            : 'Type a command or search...'
        }
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList className={searchMode === 'content-search' ? '' : undefined}>
        <CommandEmpty>
          {searchMode === 'files' 
            ? 'No files found.' 
            : searchMode === 'content-search'
            ? (isSearching ? 'Searching...' : searchQuery ? 'No matches found.' : '')
            : 'No results found.'
          }
        </CommandEmpty>
        {searchMode === 'commands' ? (
          <>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={handleToggleView}>
                {getViewModeIcon()}
                <span>{getViewModeLabel()}</span>
                <CommandShortcut>⌘⇧V</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={handleSearchFiles}>
                <Search className="mr-2 h-4 w-4" />
                <span>Jump to File</span>
                <CommandShortcut>⌘E</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={handleSearchContent}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Search in Files</span>
                <CommandShortcut>⌘⇧F</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={handleFocusInput}>
                <Type className="mr-2 h-4 w-4" />
                <span>Focus Input</span>
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={handleToggleEdit}>
                <MousePointerClick className="mr-2 h-4 w-4" />
                <span>Toggle Edit Mode</span>
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={handleToggleRecording}>
                <Mic className="mr-2 h-4 w-4" />
                <span>Toggle Recording</span>
                <CommandShortcut>⌘O</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        ) : searchMode === 'files' ? (
          <CommandGroup heading="Files">
            {filteredFiles.length === 0 && !searchQuery ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {projectId ? 'Loading files...' : 'No project selected'}
              </div>
            ) : (
              filteredFiles.map((file) => (
                <CommandItem
                  key={file.path}
                  value={file.path}
                  onSelect={() => handleSelectFile(file.path)}
                >
                  <FileCode className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{file.name}</span>
                    <span className="text-xs text-muted-foreground">{file.path}</span>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        ) : searchMode === 'content-search' ? (
          <CommandGroup heading="Search Results">
            {}
            {searchResults.length === 0 && !searchQuery ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {projectId ? 'Start typing to search in files...' : 'No project selected'}
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {isSearching ? 'Searching...' : 'No results found'}
              </div>
            ) : (
              searchResults.map((result, index) => (
                <CommandItem
                  key={`${result.filePath}-${result.lineNumber}-${index}`}
                  value={`${result.filePath} ${result.lineContent} line:${result.lineNumber}`}
                  onSelect={() => handleSelectSearchResult(result)}
                >
                  <FileCode className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <span>{result.filePath}</span>
                      <span className="mx-1">•</span>
                      <span>Line {result.lineNumber}</span>
                    </div>
                    <code className="text-sm bg-muted px-2 py-1 rounded text-left whitespace-pre-wrap break-all">
                      {result.lineContent.substring(0, result.columnStart)}
                      <mark className="bg-yellow-200 dark:bg-yellow-700">
                        {result.lineContent.substring(result.columnStart, result.columnEnd)}
                      </mark>
                      {result.lineContent.substring(result.columnEnd)}
                    </code>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
