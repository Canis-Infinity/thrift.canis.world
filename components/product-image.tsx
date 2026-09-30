"use client"
import { useState } from "react"
import Image from "next/image"
import { ImageIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
export function ProductImage({
  id,
  name,
  priority = false,
  thumbnail = false,
  sizes = "(max-width:767px) calc(100vw - 40px), (max-width:1023px) calc((100vw - 92px) / 2), (max-width:1279px) calc((100vw - 120px) / 3), 387px",
}: {
  id?: string
  name: string
  priority?: boolean
  thumbnail?: boolean
  sizes?: string
}) {
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false)
  return (
    <div
      className={
        thumbnail
          ? "relative size-14 shrink-0 overflow-hidden rounded-md bg-muted"
          : "relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
      }
    >
      {id && !failed ? (
        <>
          {!loaded && <Skeleton className="absolute inset-0 size-full" />}
          <Image
            src={`/api/thrift/images/${id}`}
            alt={name}
            fill
            sizes={thumbnail ? "56px" : sizes}
            priority={priority}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon className="size-8 stroke-1" />
          <span className={thumbnail ? "sr-only" : "text-xs"}>
            {failed ? "圖片暫時無法載入" : "尚無商品圖片"}
          </span>
        </div>
      )}
    </div>
  )
}
