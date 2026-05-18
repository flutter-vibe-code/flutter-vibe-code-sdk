"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Upload, Trash2, Image, FileText, Loader2, RefreshCw, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface Asset {
  name: string
  path: string
  type: "image" | "font" | "other"
  size?: number
  blobUrl?: string
}

interface AssetsPanelProps {
  sandboxId?: string
  projectId?: string
  onClose: () => void
}

interface AssetItemProps {
  asset: Asset
  sandboxId?: string
  onDelete: () => void
}

export function AssetsPanel({ sandboxId, projectId, onClose }: AssetsPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssets = useCallback(async () => {
    if (!sandboxId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/assets?sandboxId=${sandboxId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch assets")
      }
      const data = await response.json()
      setAssets(data.assets || [])
    } catch (err) {
      console.error("Error fetching assets:", err)
      setError("Failed to load assets")
    } finally {
      setIsLoading(false)
    }
  }, [sandboxId])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const handleUpload = async (files: FileList) => {
    if (!sandboxId || !files.length) return

    setIsUploading(true)
    setError(null)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("sandboxId", sandboxId)
        if (projectId) {
          formData.append("projectId", projectId)
        }

        const response = await fetch("/api/assets/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Upload failed")
        }
      }

      await fetchAssets()
    } catch (err) {
      console.error("Error uploading assets:", err)
      setError(err instanceof Error ? err.message : "Failed to upload assets")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (asset: Asset) => {
    if (!sandboxId) return

    try {
      const response = await fetch("/api/assets/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sandboxId,
          path: asset.path,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete asset")
      }

      await fetchAssets()
    } catch (err) {
      console.error("Error deleting asset:", err)
      setError("Failed to delete asset")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(e.target.files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getAssetIcon = (type: Asset["type"]) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />
      case "font":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Only show assets that have a blob URL mapping
  const assetsWithBlobMapping = assets.filter((a) => a.blobUrl)
  const imageAssets = assetsWithBlobMapping.filter((a) => a.type === "image")
  const fontAssets = assetsWithBlobMapping.filter((a) => a.type === "font")

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-[50px]  border-b pr-12 pl-4">
        <h2 className="font-semibold text-lg">Assets</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchAssets}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Centered content container with max-width */}
      <div className="flex-1 flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-[800px] flex flex-col h-full">
          {/* Upload area */}
          <div
            className="m-4 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.ttf,.otf,.woff,.woff2"
          onChange={handleFileSelect}
          className="hidden"
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Upload assets</p>
            <p className="text-xs text-muted-foreground">
              Images (.jpg, .png, .gif) or Fonts (.ttf, .otf, .woff)
            </p>
          </div>
        )}
      </div>

          {error && (
            <div className="mx-4 mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Assets list */}
          <ScrollArea className="flex-1 px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : assetsWithBlobMapping.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="font-medium text-muted-foreground">No assets</p>
                <p className="text-sm text-muted-foreground/70">
                  Upload images or fonts to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {/* Images section */}
                {imageAssets.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Images ({imageAssets.length})
                    </h3>
                    <div className="space-y-1">
                      {imageAssets.map((asset) => (
                        <AssetItem
                          key={asset.path}
                          asset={asset}
                          sandboxId={sandboxId}
                          onDelete={() => handleDelete(asset)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Fonts section */}
                {fontAssets.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Fonts ({fontAssets.length})
                    </h3>
                    <div className="space-y-1">
                      {fontAssets.map((asset) => (
                        <AssetItem
                          key={asset.path}
                          asset={asset}
                          sandboxId={sandboxId}
                          onDelete={() => handleDelete(asset)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

function AssetItem({ asset, sandboxId, onDelete }: AssetItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false)
    setIsDeleting(true)
    await onDelete()
    setIsDeleting(false)
  }

  // Use blob URL for thumbnails (faster and more reliable than sandbox serve)
  // Fallback to serve endpoint for old assets without blobUrl
  const imageUrl = asset.type === "image"
    ? (asset.blobUrl || (sandboxId ? `/api/assets/serve?sandboxId=${sandboxId}&path=${encodeURIComponent(asset.path)}` : null))
    : null

  return (
    <>
      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 group">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {asset.type === "image" && imageUrl ? (
            <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={asset.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : asset.type === "image" ? (
            <div className="h-10 w-10 flex-shrink-0 rounded bg-muted flex items-center justify-center">
              <Image className="h-5 w-5 text-muted-foreground" />
            </div>
          ) : (
            <div className="h-10 w-10 flex-shrink-0 rounded bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm truncate" title={asset.name}>
            {asset.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3 text-destructive" />
          )}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{asset.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
