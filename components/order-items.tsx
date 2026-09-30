import { ProductImage } from "@/components/product-image"
import { money, type OrderItem } from "@/lib/types"
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item"

export function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <ItemGroup className="text-left" aria-label="訂單商品">
      {items.map((item) => (
        <Item key={item.product} role="listitem">
          <ItemMedia>
            <ProductImage
              key={item.image}
              id={item.image ?? undefined}
              name={item.name}
              thumbnail
            />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="line-clamp-none break-words">
              {item.name}
            </ItemTitle>
            <ItemDescription>數量 {item.quantity}</ItemDescription>
          </ItemContent>
          <ItemActions className="ml-auto font-mono">
            {money(item.price * item.quantity)}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}
