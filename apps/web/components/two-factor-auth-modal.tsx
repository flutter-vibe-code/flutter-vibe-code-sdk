'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// TwoFactorMethodModal
// ---------------------------------------------------------------------------

interface TwoFactorMethodModalProps {
  open: boolean;
  onSelect: (method: 'device' | 'sms') => void;
}

export function TwoFactorMethodModal({
  open,
  onSelect,
}: TwoFactorMethodModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md border-neutral-700 bg-neutral-900 text-white"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-white font-bold">
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Choose how you want to validate your Apple Developer account
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700"
            onClick={() => onSelect('device')}
          >
            Verify with Device
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700"
            onClick={() => onSelect('sms')}
          >
            Verify with SMS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TwoFactorCodeModal
// ---------------------------------------------------------------------------

interface TwoFactorCodeModalProps {
  open: boolean;
  onSubmit: (code: string) => void;
}

export function TwoFactorCodeModal({
  open,
  onSubmit,
}: TwoFactorCodeModalProps) {
  const [digits, setDigits] = React.useState<string[]>(Array(6).fill(''));
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Reset digits when modal opens
  React.useEffect(() => {
    if (open) {
      setDigits(Array(6).fill(''));
      // Focus the first input after a short delay to allow the dialog to render
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [open]);

  const allFilled = digits.every((d) => d !== '');

  const handleChange = (index: number, value: string) => {
    // Only allow single digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // Move to previous box and clear it
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
      e.preventDefault();
    }

    if (e.key === 'Enter' && allFilled) {
      onSubmit(digits.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const next = [...digits];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    // Focus the input after the last pasted digit, or the last one
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = () => {
    if (allFilled) {
      onSubmit(digits.join(''));
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md border-neutral-700 bg-neutral-900 text-white"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-white font-bold">
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Enter the 6-digit code sent to your Apple device
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 pt-2">
          {digits.map((digit, i) => (
            <React.Fragment key={i}>
              {i === 3 && (
                <span className="text-neutral-500 text-xl font-medium mx-1">
                  —
                </span>
              )}
              <input
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="h-12 w-10 rounded-md border border-neutral-600 bg-neutral-800 text-center text-lg font-semibold text-white outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
                autoComplete="one-time-code"
              />
            </React.Fragment>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            disabled={!allFilled}
            onClick={handleSubmit}
            className="bg-white text-neutral-900 hover:bg-neutral-200 disabled:opacity-40"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
