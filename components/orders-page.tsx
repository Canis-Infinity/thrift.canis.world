"use client"
import { ListPagination, useListPagination } from "@/components/list-pagination"
import { ContactSeller } from "@/components/contact-seller"
import Link from "next/link"
import { useStore } from "@/components/providers"
import { useData } from "@/hooks/use-data"
import { PageSkeleton } from "@/components/page-skeleton"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { money, statuses, type Order } from "@/lib/types"
export function OrdersPage() {
  const { user, loading } = useStore(),
    result = useData<{ orders: Order[] }>(user ? "/orders" : null)
  const pagination = useListPagination(
    result.data?.orders.length || 0,
    user?.id || ""
  )
  if (loading || (user && result.loading)) return <PageSkeleton list />
  if (!user)
    return (
      <EmptyState
        title="登入以查看會員訂單"
        description="訪客訂單請保留結帳時的訂單編號。"
      >
        <Button render={<Link href="/login" />}>登入</Button>
      </EmptyState>
    )
  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold">我的訂單</h1>
      {result.error ? (
        <EmptyState title="無法載入訂單" description={result.error}>
          <Button onClick={result.reload}>重試</Button>
        </EmptyState>
      ) : !result.data?.orders.length ? (
        <EmptyState title="還沒有訂單">
          <Button render={<Link href="/" />}>商品列表</Button>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {result.data.orders
            .slice(pagination.start, pagination.end)
            .map((order) => (
              <article key={order.id} className="border-b pb-8">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-mono text-sm font-medium break-all">
                    {order.number}
                  </h2>
                  <Badge variant="secondary">{statuses[order.status]}</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                  </span>
                </div>
                <div className="my-4 space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.product}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-mono">
                        {money(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-right font-mono">{money(order.total)}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  請截圖私訊我訂單編號
                </p>
                <div className="mt-3">
                  <ContactSeller />
                </div>
                {order.note && (
                  <p className="mt-2 text-sm">備註：{order.note}</p>
                )}
              </article>
            ))}
        </div>
      )}
      {!result.error && <ListPagination {...pagination} />}
    </>
  )
}
