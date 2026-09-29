"use client"
import { useEffect } from "react"
import { useStore } from "@/components/providers"
import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

export default function OfflinePage() {
  const { setIsOfflinePage } = useStore()
  useEffect(() => {
    setIsOfflinePage(true)
    return () => setIsOfflinePage(false)
  }, [setIsOfflinePage])
  return (
    <div
      data-offline-page
      className="flex min-h-[60svh] items-center justify-center"
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WifiOff />
          </EmptyMedia>
          <EmptyTitle>暫時連不上網站</EmptyTitle>
          <EmptyDescription>
            網路可能中斷了，或網站暫時無法連線。檢查一下網路，稍後再試。
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <form action="/" method="get">
            <Button type="submit">重新連線</Button>
          </form>
        </EmptyContent>
      </Empty>
    </div>
  )
}
