import Auth from './auth'
import Logo from './logo'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export function AuthDialog({
  open,
  setOpen,
  callbackURL,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  callbackURL?: string
}) {
  const handleAuthSuccess = () => {
    setOpen(false)
    // Optionally refresh the page to load the new session
    window.location.reload()
  }

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Sign in with Gmail</DialogTitle>
          <DialogDescription>
            Sign in with your Google account to access Fragments
          </DialogDescription>
        </VisuallyHidden>
        <div className="flex justify-center items-center flex-col">
          <div className="w-full">
            <Auth
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              callbackURL={callbackURL}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
