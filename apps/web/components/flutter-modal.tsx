'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Smartphone } from 'lucide-react';

interface FlutterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlutterModal({ open, onOpenChange }: FlutterModalProps) {
  const handleOpenAppStore = () => {
    window.open('https://apps.apple.com/cl/app/flutter/id982107779', '_blank');
  };

  const handleGotIt = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle>Install Flutter</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            To preview your mobile app, you need to have the Flutter app installed on your phone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-2">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Install Flutter from the App Store</li>
              <li>Tap again the "Mobile app" tab icon</li>
              <li>Your app will load instantly on your device</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleGotIt}
            className="sm:flex-1"
          >
            Got it
          </Button>
          <Button
            onClick={handleOpenAppStore}
            className="sm:flex-1 gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open App Store
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
