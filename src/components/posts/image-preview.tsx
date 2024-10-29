// src/components/posts/image-preview.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ImagePreviewProps {
  src: string
  onRemove: () => void
}

export function ImagePreview({ src, onRemove }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        {isLoading && (
          <Skeleton className="absolute inset-0" />
        )}
        <Image
          src={src}
          alt="Generated image"
          fill
          className="object-cover"
          onLoadingComplete={() => setIsLoading(false)}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow-sm"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}