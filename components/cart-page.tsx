"use client"
import { ContactSeller } from "@/components/contact-seller"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Copy, Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"
import { useStore } from "@/components/providers"
import { ProductImage } from "@/components/product-image"
import { ConfirmDelete } from "@/components/confirm-delete"
import { CustomerFields, type Customer } from "@/components/customer-fields"
import { FormField } from "@/components/form-field"
import { EmptyState } from "@/components/empty-state"
import { PageSkeleton } from "@/components/page-skeleton"
import { useData } from "@/hooks/use-data"
import { useForm } from "@/hooks/use-form"
import { checkoutSchema } from "@/lib/validation"
import { ApiError, send } from "@/lib/api"
import { money, type Product, type Order } from "@/lib/types"
type CartProduct = Pick<
  Product,
  "id" | "name" | "price" | "images" | "quantity" | "active"
> & { deleted: boolean }
export function CartPage() {
  const { user, cart, setCart, cartReady, loading: authLoading } = useStore(),
    { data, loading, error, reload } = useData<{ products: CartProduct[] }>(
      cartReady
        ? `/cart-products?ids=${encodeURIComponent(cart.map((item) => item.product).join(","))}`
        : null
    ),
    { pending, errors, submit } = useForm()
  const [customer, setCustomer] = useState<Customer>({
      name: "",
      contact: { platform: "LINE", account: "" },
    }),
    [note, setNote] = useState(""),
    [remove, setRemove] = useState<string | null>(null),
    [order, setOrder] = useState<Order | null>(null)
  const submission = useRef<{ body: string; key: string } | null>(null)
  useEffect(() => {
    if (!cartReady || !cart.length || order) return
    const refresh = () => {
      if (document.visibilityState === "visible") reload()
    }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    const timer = window.setInterval(refresh, 15000)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
      window.clearInterval(timer)
    }
  }, [cartReady, cart.length, order, reload])
  useEffect(() => {
    if (user)
      setCustomer({
        name: user.name,
        contact: user.contact ?? { platform: "LINE", account: "" },
      })
  }, [user])
  if (loading || !cartReady || authLoading) return <PageSkeleton list />
  if (error)
    return (
      <EmptyState title="無法確認最新庫存" description={error}>
        <Button onClick={reload}>重試</Button>
      </EmptyState>
    )
  if (order)
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="mx-auto mb-7 flex size-16 items-center justify-center rounded-full bg-muted">
          <Check className="size-7" />
        </div>
        <h1 className="mt-3 text-3xl font-semibold">訂單已成立</h1>
        <p className="mt-4 text-lg">請截圖私訊我訂單編號</p>
        <div className="mt-4">
          <ContactSeller />
        </div>
        <div className="my-8 rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">訂單編號</p>
          <p className="mt-3 font-mono text-xl break-all">{order.number}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(order.number)
                toast.add({ title: "訂單編號已複製", type: "success" })
              } catch {
                toast.add({
                  title: "無法複製，請手動選取訂單編號",
                  type: "error",
                })
              }
            }}
          >
            <Copy />
            複製編號
          </Button>
          <Separator className="my-5" />
          {order.items.map((i) => (
            <div
              key={i.product}
              className="mb-2 flex justify-between gap-4 text-left text-sm"
            >
              <span>
                {i.name} × {i.quantity}
              </span>
              <span className="font-mono">{money(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="mt-5 flex justify-between font-medium">
            <span>商品合計</span>
            <span className="font-mono">{money(order.total)}</span>
          </div>
        </div>
        <p className="mb-7 text-sm text-muted-foreground">
          本站不提供線上金流，付款及交付細節請透過私訊確認。
        </p>
        <div className="mb-5 flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            render={<Link href={`/order/${order.token}`} />}
          >
            查看訂單
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/order/${order.token}`
                )
                toast.add({
                  title: "訂單私密連結已複製，請妥善保存",
                  type: "success",
                })
              } catch {
                toast.add({
                  title: "複製失敗，請開啟訂單後儲存網址",
                  type: "error",
                })
              }
            }}
          >
            <Copy />
            複製訂單連結
          </Button>
        </div>
        <Button render={<Link href="/" />}>繼續選購</Button>
      </div>
    )
  if (!cart.length)
    return (
      <EmptyState
        title="購物車還空著"
        description="還沒看到喜歡的？回商品列表再逛逛。"
      >
        <Button render={<Link href="/" />}>商品列表</Button>
      </EmptyState>
    )
  const lines = cart.map((i) => ({
      ...i,
      detail: data?.products.find((p) => p.id === i.product),
    })),
    invalid = lines.some(
      (i) =>
        !i.detail?.active || i.detail.deleted || i.quantity > i.detail.quantity
    ),
    total = lines.reduce((s, i) => s + (i.detail?.price || 0) * i.quantity, 0)
  function quantity(id: string, n: number) {
    setCart(cart.map((i) => (i.product === id ? { ...i, quantity: n } : i)))
  }
  return (
    <>
      <h1 className="mt-2 mb-9 text-3xl font-semibold">購物車</h1>
      <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
        <section className="space-y-5">
          {lines.map((i) => (
            <div key={i.product} className="flex gap-4 border-b pb-5">
              <div className="w-24 shrink-0 sm:w-36">
                <ProductImage
                  sizes="(max-width:639px) 96px, 144px"
                  id={i.detail?.images[0]}
                  name={i.detail?.name || "已下架商品"}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h2 className="text-sm font-medium">
                  {i.detail?.name || "這件商品暫時買不到了"}
                </h2>
                {i.detail && (i.detail.deleted || !i.detail.active) && (
                  <Badge variant="destructive">
                    {i.detail.deleted ? "已刪除" : "已下架"}
                  </Badge>
                )}
                <p className="font-mono text-sm">
                  {i.detail ? money(i.detail.price) : "價格暫時無法取得"}
                </p>
                {i.detail && i.quantity > i.detail.quantity && (
                  <div className="space-y-2">
                    <Badge variant="destructive">庫存不足</Badge>
                    <FieldError>
                      目前剩餘 {i.detail.quantity} 件，請調整數量
                    </FieldError>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={
                      pending ||
                      !i.detail?.active ||
                      i.detail.deleted ||
                      i.quantity <= 1
                    }
                    aria-label={`減少 ${i.detail?.name} 數量`}
                    onClick={() => quantity(i.product, i.quantity - 1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center font-mono text-sm">
                    {i.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={
                      pending ||
                      !i.detail?.active ||
                      i.detail.deleted ||
                      i.quantity >= i.detail.quantity
                    }
                    aria-label={`增加 ${i.detail?.name} 數量`}
                    onClick={() => quantity(i.product, i.quantity + 1)}
                  >
                    <Plus />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto"
                    disabled={pending}
                    aria-label={`移除 ${i.detail?.name || "商品"}`}
                    onClick={() => setRemove(i.product)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button variant="ghost" render={<Link href="/" />}>
            <ArrowLeft />
            繼續選購
          </Button>
        </section>
        <form
          noValidate
          className="space-y-5 rounded-xl border p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault()
            void submit(
              checkoutSchema,
              { customer, items: cart, note },
              async (values) => {
                const body = JSON.stringify(values)
                try {
                  const saved = JSON.parse(
                    sessionStorage.getItem("thrift-checkout-attempt") || "null"
                  )
                  if (saved?.body === body && typeof saved?.key === "string")
                    submission.current = saved
                } catch {
                  /* Storage can be unavailable in private browsing. */
                }
                if (submission.current?.body !== body)
                  submission.current = { body, key: crypto.randomUUID() }
                try {
                  sessionStorage.setItem(
                    "thrift-checkout-attempt",
                    JSON.stringify(submission.current)
                  )
                } catch {}
                const result = await send<{ order: Order }>(
                  "/checkout",
                  "POST",
                  { ...values, key: submission.current!.key }
                ).catch((error: unknown) => {
                  if (
                    error instanceof ApiError &&
                    [404, 409].includes(error.status)
                  )
                    reload()
                  throw error
                })
                setOrder(result.order)
                setCart([])
                submission.current = null
                try {
                  sessionStorage.removeItem("thrift-checkout-attempt")
                } catch {}
              },
              "訂單已成立"
            )
          }}
        >
          <h2 className="text-xl font-semibold">
            {user ? "確認聯繫資料" : "訪客結帳"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {user
              ? "已帶入會員資料，請確認聯繫帳號正確。"
              : "不必註冊，留下姓名與聯繫方式即可下單。"}
          </p>
          <CustomerFields
            value={customer}
            onChange={setCustomer}
            errors={errors}
          />
          <FormField id="note" label="訂單備註" error={errors.note}>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="有什麼想先讓我知道的嗎？"
            />
          </FormField>
          <Separator />
          <div className="flex items-center justify-between">
            <span>商品合計</span>
            <span className="font-mono text-xl">{money(total)}</span>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            不含線上付款。付款、運費與交付方式於私訊確認。成立訂單後會保留庫存，請截圖並私訊訂單編號。
          </p>
          <FieldError>{errors.items || errors.form}</FieldError>
          {invalid && (
            <FieldError>
              有商品已刪除、下架或數量不夠，調整購物車後就能繼續。
            </FieldError>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={pending || invalid}
          >
            {pending ? "正在建立訂單…" : "確認並建立訂單"}
          </Button>
        </form>
      </div>
      {remove && (
        <ConfirmDelete
          title="從購物車移除此商品？"
          onConfirm={() => setCart(cart.filter((i) => i.product !== remove))}
          onClose={() => setRemove(null)}
        />
      )}
    </>
  )
}
