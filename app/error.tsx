"use client"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <EmptyState title="頁面暫時無法載入" description="請稍後重試。">
      <Button onClick={reset}>重試</Button>
    </EmptyState>
  )
}
