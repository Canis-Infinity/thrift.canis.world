"use client"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FormField } from "@/components/form-field"
import { AppSelect } from "@/components/app-select"
import { ImageUpload } from "@/components/image-upload"
import { categoryLabel } from "@/components/catalog"
import { useForm } from "@/hooks/use-form"
import { productSchema } from "@/lib/validation"
import { send } from "@/lib/api"
import type { Product, Category } from "@/lib/types"
export function ProductEditor({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product?: Product
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState({
      name: product?.name || "",
      price: String(product?.price ?? ""),
      description: product?.description || "",
      tags: product?.tags.join("、") || "",
      images: product?.images || [],
      quantity: String(product?.quantity ?? 1),
      category: product?.category || "none",
      active: product?.active ?? true,
    }),
    [uploading, setUploading] = useState(false)
  const { errors, pending, submit } = useForm()
  const busy = pending || uploading
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose()
      }}
    >
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "編輯商品" : "新增商品"}</DialogTitle>
          <DialogDescription>
            填寫物品狀況並上傳照片，讓下一位主人更了解它。
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (uploading) return
            void submit(
              productSchema,
              {
                ...values,
                price: values.price.trim() === "" ? NaN : Number(values.price),
                quantity:
                  values.quantity.trim() === "" ? NaN : Number(values.quantity),
                tags: [
                  ...new Set(
                    values.tags
                      .split(/[,，、\n]/)
                      .map((t) => t.trim())
                      .filter(Boolean)
                  ),
                ],
                category: values.category === "none" ? null : values.category,
              },
              async (data) => {
                await send(
                  `/admin/products${product ? `/${product.id}` : ""}`,
                  product ? "PUT" : "POST",
                  { ...data, ...(product ? { version: product.version } : {}) }
                )
                onSaved()
                onClose()
              }
            )
          }}
        >
          <FormField
            id="product-name"
            label="商品名稱"
            required
            error={errors.name}
          >
            <Input
              id="product-name"
              required
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="price" label="金額" required error={errors.price}>
              <InputGroup>
                <InputGroupAddon>NT$</InputGroupAddon>
                <InputGroupInput
                  id="price"
                  required
                  type="number"
                  min="0"
                  max="999999999"
                  step="1"
                  inputMode="numeric"
                  className="font-mono"
                  value={values.price}
                  onChange={(e) =>
                    setValues({ ...values, price: e.target.value })
                  }
                />
              </InputGroup>
            </FormField>
            <FormField
              id="quantity"
              label="商品數量"
              required
              error={errors.quantity}
            >
              <Input
                id="quantity"
                required
                type="number"
                min="0"
                max="99999"
                step="1"
                value={values.quantity}
                onChange={(e) =>
                  setValues({ ...values, quantity: e.target.value })
                }
              />
            </FormField>
          </div>
          <FormField id="category" label="商品分類" error={errors.category}>
            <AppSelect
              id="category"
              value={values.category}
              onValueChange={(category) => setValues({ ...values, category })}
              options={[
                { value: "none", label: "未分類" },
                ...categories.map((c) => ({
                  value: c.id,
                  label: categoryLabel(c.id, categories),
                })),
              ]}
            />
          </FormField>
          <FormField
            id="tags"
            label="標籤"
            required
            error={errors.tags}
            description="至少一個，以逗號或頓號分隔。例如：近全新、生活用品。"
          >
            <Input
              id="tags"
              required
              value={values.tags}
              onChange={(e) => setValues({ ...values, tags: e.target.value })}
            />
          </FormField>
          <FormField
            id="description"
            label="商品說明"
            error={errors.description}
            description="支援 Markdown。建議填寫使用狀況、尺寸、配件及已知瑕疵。"
          >
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">編輯</TabsTrigger>
                <TabsTrigger value="preview">預覽</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  id="description"
                  rows={6}
                  value={values.description}
                  onChange={(e) =>
                    setValues({ ...values, description: e.target.value })
                  }
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="markdown min-h-36 rounded-lg border p-4 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {values.description || "尚未填寫商品說明。"}
                  </ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </FormField>
          <FormField
            id="images"
            label="商品照片"
            required
            error={errors.images}
          >
            <ImageUpload
              images={values.images}
              onChange={(images) => setValues((v) => ({ ...v, images }))}
              onBusy={setUploading}
              disabled={busy}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.active}
              onCheckedChange={(v) => setValues({ ...values, active: !!v })}
            />
            上架並顯示於物品列表
          </label>
          <FieldError>{errors.form}</FieldError>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit" disabled={busy}>
              {uploading ? "圖片上傳中…" : pending ? "儲存中…" : "儲存商品"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
