'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageName?: string
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  imageName,
}: ImagePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogTitle className="sr-only">{imageName || 'Image preview'}</DialogTitle>
        <div className="relative w-full h-full">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={imageUrl}
            alt={imageName || 'Preview'}
            className="w-full h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
