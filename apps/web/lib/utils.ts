// Define cn locally to avoid client module tainting from @flutter-vibe-code/ui
// This allows cn to be used in both server and client components
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// App-specific utility functions
export function isFileInArray(file: File, existingFiles: File[]) {
  return existingFiles.some(
    (existing) =>
      existing.name === file.name &&
      existing.size === file.size &&
      existing.type === file.type
  )
}
