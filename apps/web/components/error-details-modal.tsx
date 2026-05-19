'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, Send } from 'lucide-react'

interface ErrorDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  errorData: {
    message: string
    timestamp: string
    projectId: string
  } | null
  onSendToFix: (message: string) => void
}

export function ErrorDetailsModal({
  isOpen,
  onClose,
  errorData,
  onSendToFix,
}: ErrorDetailsModalProps) {
  if (!errorData) return null

  const handleSendToFix = () => {
    onSendToFix(errorData.message)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Details
          </DialogTitle>
          <DialogDescription>
            Error occurred at {new Date(errorData.timestamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
            {errorData.message}
          </pre>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSendToFix}>
            <Send className="mr-2 h-4 w-4" />
            Send to Fix
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}