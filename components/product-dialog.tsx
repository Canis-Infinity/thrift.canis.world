"use client"
import { useRef, useState } from "react"
import { ShoppingBag, Minus, Plus } from "lucide-react"
import { z } from "zod"
import { FormField } from "@/components/form-field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { toast } from "@/components/ui/toast"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
const MarkdownContent = dynamic(() => import("@/components/markdown-content"), {
  loading: () => (
    <div role="status" aria-label="載入商品說明" className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),
})
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductImageViewer } from "@/components/product-image-viewer"
import { useStore } from "@/components/providers"
import { api } from "@/lib/api"
import { mutation } from "@/lib/notifications"
import { Spinner } from "@/components/ui/spinner"
import { money, type Catalog, type Product } from "@/lib/types"
export function ProductDialog({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const [selected, setSelected] = useState(0),
    { cart, setCart, cartReady } = useStore()
  const [available, setAvailable] = useState(product.quantity)
  const [checking, setChecking] = useState(false)
  const [quantity, setQuantity] = useState("1")
  const [quantityError, setQuantityError] = useState("")
  const inCart = cart.find((item) => item.product === product.id)?.quantity || 0
  const remaining = Math.max(0, available - inCart)
  function changeQuantity(value: string) {
    setQuantity(value)
    setQuantityError("")
  }
  const checkingRef = useRef(false)
  async function add() {
    if (!cartReady || checkingRef.current) return
    const parsed = z
      .string()
      .trim()
      .regex(/^\d+$/, "請輸入至少 1 件的整數數量")
      .transform(Number)
      .pipe(
        z.number().int().min(1, "數量至少 1 件").max(99999, "數量最多 99999 件")
      )
      .safeParse(quantity)
    if (!parsed.success) {
      const message = parsed.error.issues[0].message
      setQuantityError(message)
      toast.add({ title: message, type: "error" })
      return
    }
    const amount = parsed.data
    checkingRef.current = true
    setChecking(true)
    try {
      await mutation("確認最新庫存中…", "已加入購物車", async () => {
        const catalog = await api<Catalog>("/catalog")
        const latest = catalog.products.find((item) => item.id === product.id)
        setAvailable(latest?.quantity ?? 0)
        if (!latest) throw new Error("商品已下架，無法加入購物車")
        const count =
          cart.find((item) => item.product === product.id)?.quantity || 0
        if (count + amount > latest.quantity) {
          const message = `目前剩餘 ${latest.quantity} 件，購物車已有 ${count} 件，這次最多可加入 ${Math.max(0, latest.quantity - count)} 件`
          setQuantityError(message)
          throw new Error(message)
        }
        setCart([
          ...cart.filter((item) => item.product !== product.id),
          { product: product.id, quantity: count + amount },
        ])
        setQuantityError("")
      })
      onClose()
    } catch {
    } finally {
      checkingRef.current = false
      setChecking(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !checkingRef.current) onClose()
      }}
    >
      <DialogContent className="flex max-h-[92svh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            下單前請確認商品狀況，付款與交付方式再私訊確認。
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 grid min-h-0 gap-6 overflow-y-auto px-4 py-1 md:grid-cols-2">
          <div>
            <ProductImageViewer
              images={product.images}
              name={product.name}
              selected={selected}
              onSelect={setSelected}
            />
            {product.images.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {product.images.map((id, i) => (
                  <Button
                    key={id}
                    variant={i === selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelected(i)}
                  >
                    照片 {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-5">
            <p className="font-mono text-3xl">{money(product.price)}</p>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {available ? `剩餘 ${available} 件` : "已售完"}
            </p>
            <FormField
              id="add-quantity"
              label="數量"
              required
              error={quantityError}
              description={
                inCart
                  ? `購物車已有 ${inCart} 件，還可加入 ${remaining} 件`
                  : undefined
              }
            >
              <InputGroup className="max-w-44">
                <InputGroupAddon>
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="減少加入數量"
                    disabled={checking || !remaining || Number(quantity) <= 1}
                    onClick={() =>
                      changeQuantity(
                        String(Math.max(1, (Number(quantity) || 1) - 1))
                      )
                    }
                  >
                    <Minus />
                  </InputGroupButton>
                </InputGroupAddon>
                <InputGroupInput
                  id="add-quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={remaining || 1}
                  step={1}
                  required
                  value={quantity}
                  disabled={checking || !remaining}
                  aria-invalid={!!quantityError}
                  aria-describedby="add-quantity-error"
                  onChange={(e) => changeQuantity(e.target.value)}
                  className="text-center font-mono"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="增加加入數量"
                    disabled={
                      checking || !remaining || Number(quantity) >= remaining
                    }
                    onClick={() =>
                      changeQuantity(
                        String(Math.min(remaining, (Number(quantity) || 0) + 1))
                      )
                    }
                  >
                    <Plus />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </FormField>
            <div className="markdown text-sm leading-7">
              <MarkdownContent>
                {product.description || "尚無商品說明。"}
              </MarkdownContent>
            </div>
          </div>
        </div>
        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={onClose} disabled={checking}>
            關閉
          </Button>
          <Button disabled={!cartReady || checking || !available} onClick={add}>
            {checking ? <Spinner /> : <ShoppingBag />}
            {checking ? "確認庫存中…" : "加入購物車"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
