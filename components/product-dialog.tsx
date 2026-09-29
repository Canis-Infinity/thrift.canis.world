"use client"
import { useState } from "react"
import { ShoppingBag } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductImage } from "@/components/product-image"
import { useStore } from "@/components/providers"
import { toast } from "@/components/ui/toast"
import { money, type Product } from "@/lib/types"
export function ProductDialog({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const [selected, setSelected] = useState(0),
    { cart, setCart, cartReady } = useStore()
  function add() {
    const count = cart.find((i) => i.product === product.id)?.quantity || 0
    if (count >= product.quantity) {
      toast.add({ title: "購物車數量已達可購買庫存", type: "error" })
      return
    }
    setCart([
      ...cart.filter((i) => i.product !== product.id),
      { product: product.id, quantity: count + 1 },
    ])
    toast.add({ title: "已加入購物車", type: "success" })
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            商品狀況請參閱說明，交付細節於下單後私訊確認。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <ProductImage
              key={product.images[selected]}
              id={product.images[selected]}
              name={product.name}
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
              {product.quantity ? `剩餘 ${product.quantity} 件` : "已售完"}
            </p>
            <div className="markdown text-sm leading-7">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {product.description || "尚無商品說明。"}
              </ReactMarkdown>
            </div>
            <Button
              className="w-full"
              disabled={!cartReady || !product.quantity}
              onClick={add}
            >
              <ShoppingBag />
              加入購物車
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
