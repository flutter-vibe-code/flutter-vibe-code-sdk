import { DeployDialog } from './deploy-dialog'
import { FragmentCode } from './fragment-code'
import { FragmentPreview } from './fragment-preview'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { LoaderCircle } from 'lucide-react'

export function Preview({
  teamID,
  accessToken,
  isChatLoading,
  isPreviewLoading,
  fragment,
  result,
  onClose,
}: {
  teamID: string | undefined
  accessToken: string | undefined
  isChatLoading: boolean
  isPreviewLoading: boolean
  fragment?: DeepPartial<FragmentSchema>
  result?: ExecutionResult
  onClose: () => void
}) {
  const isLinkAvailable = result?.template !== 'code-interpreter-v1'

  return (
    <div className="absolute md:relative z-10 top-0 left-0 shadow-2xl bg-popover h-full w-full overflow-hidden flex flex-col md:flex-row">
      {/* Code and fragment section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Side by side content */}
        {fragment && (
          <div className="flex-1 flex overflow-hidden">
            {/* Code section */}
            <div className="w-full border-r overflow-auto">
              <div className="p-2 border-b bg-muted/50">
                <span className="text-xs font-medium flex items-center gap-1">
                  {isChatLoading && (
                    <LoaderCircle
                      strokeWidth={3}
                      className="h-3 w-3 animate-spin"
                    />
                  )}
                  Code
                </span>
              </div>
              <div className="h-full">
                {fragment.code && fragment.file_path && (
                  <FragmentCode
                    files={[
                      {
                        name: fragment.file_path,
                        content: fragment.code,
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview section (always visible) */}
      <div className="w-full md:w-1/2 border-l overflow-auto">
        <div className="p-2 border-b bg-muted/50">
          <span className="text-xs font-medium flex items-center gap-1">
            Preview
            {isPreviewLoading && (
              <LoaderCircle strokeWidth={3} className="h-3 w-3 animate-spin" />
            )}
          </span>
        </div>
        <div className="h-full">
          {isPreviewLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Starting server...
                </p>
              </div>
            </div>
          ) : result ? (
            <FragmentPreview result={result as ExecutionResult} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
