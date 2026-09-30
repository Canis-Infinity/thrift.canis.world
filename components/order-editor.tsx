"use client"
import { useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { FormField } from "@/components/form-field"
import { CustomerFields, type Customer } from "@/components/customer-fields"
import { AppSelect } from "@/components/app-select"
import { ProductImage } from "@/components/product-image"
import { OrderItems } from "@/components/order-items"
import { Separator } from "@/components/ui/separator"
import { ConfirmDelete } from "@/components/confirm-delete"
import { useForm } from "@/hooks/use-form"
import { orderSchema, orderUpdateSchema } from "@/lib/validation"
import { send } from "@/lib/api"
import { money, statuses, type Product, type Order } from "@/lib/types"
export function OrderEditor({
  order,
  products,
  onClose,
  onSaved,
}: {
  order?: Order
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const [customer, setCustomer] = useState<Customer>(
      order?.customer || {
        name: "",
        contact: { platform: "LINE", account: "" },
      }
    ),
    [items, setItems] = useState(
      order?.items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
      })) || [{ product: "", quantity: 1 }]
    ),
    [status, setStatus] = useState(order?.status || "pending"),
    [note, setNote] = useState(order?.note || ""),
    [remove, setRemove] = useState<number | null>(null)
  const key = useRef<string | null>(null),
    { errors, pending, submit } = useForm()
  const options = [
    { value: "", label: "選擇商品" },
    ...products.map((p) => ({
      value: p.id,
      label: `${p.name} · ${money(p.price)} · 剩 ${p.quantity}`,
    })),
    ...(order?.items
      .filter((i) => !products.some((p) => p.id === i.product))
      .map((i) => ({ value: i.product, label: `${i.name}（已刪除）` })) || []),
  ]
  const productImages = new Map(
    order?.items.map((i) => [i.product, i.image ?? undefined])
  )
  for (const product of products)
    productImages.set(product.id, product.images[0])
  const imageFor = (id: string) => productImages.get(id)
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !pending) onClose()
      }}
    >
      <DialogContent className="flex max-h-[92svh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle>{order ? "編輯訂單" : "新增訂單"}</DialogTitle>
          <DialogDescription>
            {order?.number || "為私訊或面交顧客建立訂單，成立時會同步扣庫存。"}
          </DialogDescription>
        </DialogHeader>
        <form
          id="order-editor-form"
          noValidate
          className="-mx-4 min-h-0 space-y-5 overflow-y-auto px-4 py-1"
          onSubmit={(e) => {
            e.preventDefault()
            if (order) {
              void submit(orderUpdateSchema, { status, note }, async (data) => {
                await send(`/admin/orders/${order.id}`, "PUT", {
                  ...data,
                  version: order.version,
                })
                onSaved()
                onClose()
              })
              return
            }
            void submit(
              orderSchema,
              { customer, items, note, status },
              async (data) => {
                key.current ||= crypto.randomUUID()
                const { status: unused, ...body } = data
                void unused
                await send("/admin/orders", "POST", {
                  ...body,
                  key: key.current,
                })
                onSaved()
                onClose()
              }
            )
          }}
        >
          {order ? (
            <>
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">顧客姓名</dt>
                  <dd className="mt-1 font-medium break-words">
                    {order.customer.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">聯繫方式</dt>
                  <dd className="mt-1">{order.customer.contact.platform}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">帳號或連結</dt>
                  <dd className="mt-1 break-all">
                    {order.customer.contact.account}
                  </dd>
                </div>
              </dl>
              <Separator />
              <section aria-label="訂單內容" className="space-y-4">
                <OrderItems items={order.items} />
                <div className="flex items-center justify-between border-t pt-4 text-sm">
                  <span>商品合計</span>
                  <span className="font-mono font-medium">
                    {money(order.total)}
                  </span>
                </div>
              </section>
              <Separator />
            </>
          ) : (
            <>
              <CustomerFields
                value={customer}
                onChange={setCustomer}
                errors={errors}
              />
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  訂單商品 <span className="text-destructive">*</span>
                </p>
                {items.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="grid grid-cols-[56px_minmax(0,1fr)_32px] items-end gap-3 sm:grid-cols-[56px_minmax(0,1fr)_76px_32px]">
                      <ProductImage
                        key={imageFor(item.product)}
                        id={imageFor(item.product)}
                        name={
                          options.find((o) => o.value === item.product)
                            ?.label || "商品"
                        }
                        thumbnail
                      />
                      <div className="col-span-2 min-w-0 sm:col-span-1">
                        <FormField
                          id={`item-${index}`}
                          label={`商品 ${index + 1}`}
                          required
                          error={errors[`items.${index}.product`]}
                        >
                          <AppSelect
                            id={`item-${index}`}
                            required
                            value={item.product}
                            options={options}
                            renderOption={(option) =>
                              option.value ? (
                                <span className="flex min-w-0 items-center gap-2">
                                  <ProductImage
                                    id={imageFor(option.value)}
                                    name={option.label}
                                    thumbnail
                                  />
                                  <span className="min-w-0 break-words whitespace-normal">
                                    {option.label}
                                  </span>
                                </span>
                              ) : (
                                option.label
                              )
                            }
                            onValueChange={(product) =>
                              setItems(
                                items.map((v, i) =>
                                  i === index ? { ...v, product } : v
                                )
                              )
                            }
                            className="w-full min-w-0"
                          />
                        </FormField>
                      </div>
                      <div className="col-start-2 w-20 min-w-0 sm:col-start-3 sm:w-auto">
                        <FormField
                          id={`count-${index}`}
                          label="數量"
                          required
                          error={errors[`items.${index}.quantity`]}
                        >
                          <Input
                            id={`count-${index}`}
                            type="number"
                            inputMode="numeric"
                            required
                            min="1"
                            step="1"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              setItems(
                                items.map((v, i) =>
                                  i === index
                                    ? { ...v, quantity: Number(e.target.value) }
                                    : v
                                )
                              )
                            }
                          />
                        </FormField>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`移除訂單商品 ${index + 1}`}
                        onClick={() => setRemove(index)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
                <FieldError>{errors.items}</FieldError>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setItems([...items, { product: "", quantity: 1 }])
                  }
                >
                  <Plus />
                  新增商品項目
                </Button>
              </div>
            </>
          )}
          {order && (
            <FormField
              id="status"
              label="訂單狀態"
              required
              error={errors.status}
            >
              <AppSelect
                id="status"
                required
                value={status}
                onValueChange={(v) => setStatus(v as Order["status"])}
                options={Object.entries(statuses).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </FormField>
          )}
          <FormField id="order-note" label="備註" error={errors.note}>
            <Textarea
              id="order-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>
          <p className="text-xs leading-6 text-muted-foreground">
            {order
              ? "取消訂單會補回庫存；恢復訂單時會重新確認庫存。"
              : "成立訂單時會依商品數量扣除庫存。"}
          </p>
          <FieldError>{errors.form}</FieldError>
        </form>
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            取消
          </Button>
          <Button form="order-editor-form" type="submit" disabled={pending}>
            {pending ? "儲存中…" : "儲存訂單"}
          </Button>
        </DialogFooter>
        {remove !== null && (
          <ConfirmDelete
            title="移除此訂單商品？"
            description="儲存訂單後會同步調整庫存。"
            onConfirm={() => setItems(items.filter((_, i) => i !== remove))}
            onClose={() => setRemove(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
