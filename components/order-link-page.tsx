"use client"
import { ContactSeller } from "@/components/contact-seller"
import { OrderItems } from "@/components/order-items"
import { useData } from "@/hooks/use-data"
import { PageSkeleton } from "@/components/page-skeleton"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { money, statuses, type Order } from "@/lib/types"
export function OrderLinkPage({ token }: { token: string }) {
  const { data, loading, error, reload } = useData<{ order: Order }>(
    `/order-link/${token}`
  )
  if (loading) return <PageSkeleton list />
  if (error || !data)
    return (
      <EmptyState title="無法查看訂單" description={error}>
        <Button onClick={reload}>重試</Button>
      </EmptyState>
    )
  const { order } = data
  return (
    <article className="mx-auto max-w-2xl py-8">
      <p className="text-xs tracking-widest text-muted-foreground">
        YOUR ORDER
      </p>
      <h1 className="mt-3 mb-6 text-3xl font-semibold">訂單詳情</h1>
      <p className="mb-4 font-mono break-all">{order.number}</p>
      <Badge variant="secondary">{statuses[order.status]}</Badge>
      <div className="my-8 space-y-4 border-y py-6">
        <OrderItems items={order.items} />
      </div>
      <p className="text-right font-mono text-xl">合計 {money(order.total)}</p>
      <p className="mt-8">請截圖私訊我訂單編號</p>
      <div className="mt-4">
        <ContactSeller />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        交付方式與運費私訊詳談。此連結可查看訂單，請妥善保管。
      </p>
    </article>
  )
}
