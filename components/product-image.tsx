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
}: {
  id?: string
  name: string
  priority?: boolean
  thumbnail?: boolean
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
            sizes={
              thumbnail
                ? "56px"
                : "(max-width:767px) 100vw, (max-width:1023px) 50vw, 33vw"
            }
            unoptimized
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
