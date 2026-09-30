"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductImage } from "@/components/product-image"

const ViewerPhoto = dynamic(
  () => import("@/components/zoomable-product-photo"),
  {
    loading: () => (
      <Skeleton aria-label="照片載入中" className="min-h-0 flex-1" />
    ),
  }
)

export function ProductImageViewer({
  images,
  name,
  selected,
  onSelect,
}: {
  images: string[]
  name: string
  selected: number
  onSelect: (index: number) => void
}) {
  const [open, setOpen] = useState(false)
  if (!images.length) return <ProductImage name={name} />
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="relative block w-full cursor-zoom-in rounded-xl text-left outline-offset-4"
            aria-label={`放大檢視 ${name} 的照片`}
          />
        }
      >
        <ProductImage
          key={images[selected]}
          id={images[selected]}
          name={name}
          sizes="(max-width:767px) calc(100vw - 64px), 356px"
        />
        <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-xs">
          <ZoomIn className="size-4" />
          放大檢視
        </span>
      </DialogTrigger>
      <DialogContent
        className="flex h-[92svh] max-h-[92svh] flex-col overflow-hidden sm:max-w-6xl"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" && selected > 0) {
            event.preventDefault()
            onSelect(selected - 1)
          }
          if (event.key === "ArrowRight" && selected < images.length - 1) {
            event.preventDefault()
            onSelect(selected + 1)
          }
        }}
      >
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle>{name}・照片</DialogTitle>
          <DialogDescription>
            滾輪或雙指縮放，拖曳移動；雙擊放大或還原。
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ViewerPhoto
            key={images[selected]}
            id={images[selected]}
            name={`${name}，照片 ${selected + 1}`}
          />
        )}
        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="上一張照片"
              disabled={selected === 0}
              onClick={() => onSelect(selected - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm tabular-nums" aria-live="polite">
              {selected + 1} / {images.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="下一張照片"
              disabled={selected === images.length - 1}
              onClick={() => onSelect(selected + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <DialogClose render={<Button variant="outline" />}>
            關閉照片
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
