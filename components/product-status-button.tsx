"use client"

import { useRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { DesktopTooltip } from "@/components/desktop-tooltip"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { send } from "@/lib/api"
import { mutation } from "@/lib/notifications"
import type { Product } from "@/lib/types"

export function ProductStatusButton({
  product,
  onSaved,
}: {
  product: Product
  onSaved: () => void
}) {
  const [pending, setPending] = useState(false)
  const inFlight = useRef(false)
  const action = product.active ? "下架" : "上架"
  return (
    <DesktopTooltip label={pending ? `${action}中…` : action}>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-busy={pending}
        aria-label={`${action} ${product.name}`}
        onClick={async () => {
          if (inFlight.current) return
          inFlight.current = true
          setPending(true)
          try {
            const {
              name,
              price,
              description,
              tags,
              images,
              quantity,
              category,
              version,
            } = product
            await mutation(`商品${action}中…`, `商品已${action}`, () =>
              send(`/admin/products/${product.id}`, "PUT", {
                name,
                price,
                description,
                tags,
                images,
                quantity,
                category,
                version,
                active: !product.active,
              })
            )
          } catch {
            // The mutation helper displays the API error; reload also resolves stale versions.
          } finally {
            onSaved()
            inFlight.current = false
            setPending(false)
          }
        }}
      >
        {pending ? <Spinner /> : product.active ? <EyeOff /> : <Eye />}
      </Button>
    </DesktopTooltip>
  )
}
