import { ProductImage } from "@/components/product-image"
import { money, type OrderItem } from "@/lib/types"

export function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <ul className="space-y-4 text-left text-sm" aria-label="訂單商品">
      {items.map((item) => (
        <li key={item.product} className="flex items-center gap-3">
          <ProductImage
            key={item.image}
            id={item.image ?? undefined}
            name={item.name}
            thumbnail
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium break-words">{item.name}</p>
            <p className="mt-1 text-muted-foreground">數量 {item.quantity}</p>
          </div>
          <span className="shrink-0 font-mono">
            {money(item.price * item.quantity)}
          </span>
        </li>
      ))}
    </ul>
  )
}
