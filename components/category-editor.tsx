"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { FormField } from "@/components/form-field"
import { AppSelect } from "@/components/app-select"
import { categoryLabel } from "@/components/catalog"
import { useForm } from "@/hooks/use-form"
import { categorySchema } from "@/lib/validation"
import { send } from "@/lib/api"
import type { Category } from "@/lib/types"
export function CategoryEditor({
  category,
  categories,
  onClose,
  onSaved,
}: {
  category?: Category
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(category?.name || ""),
    [parent, setParent] = useState(category?.parent || "none"),
    { errors, pending, submit } = useForm()
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !pending) onClose()
      }}
    >
      <DialogContent className="flex max-h-[92svh] flex-col overflow-hidden">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle>{category ? "編輯分類" : "新增分類"}</DialogTitle>
          <DialogDescription>
            可建立最多三層分類；移動分類時也會檢查子分類深度。
          </DialogDescription>
        </DialogHeader>
        <form
          id="category-editor-form"
          noValidate
          className="-mx-4 min-h-0 space-y-5 overflow-y-auto px-4 py-1"
          onSubmit={(e) => {
            e.preventDefault()
            void submit(
              categorySchema,
              { name, parent: parent === "none" ? null : parent },
              async (data) => {
                await send(
                  `/admin/categories${category ? `/${category.id}` : ""}`,
                  category ? "PUT" : "POST",
                  {
                    ...data,
                    ...(category ? { version: category.version } : {}),
                  }
                )
                onSaved()
                onClose()
              }
            )
          }}
        >
          <FormField
            id="category-name"
            label="分類名稱"
            required
            error={errors.name}
          >
            <Input
              id="category-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField id="parent" label="上層分類" error={errors.parent}>
            <AppSelect
              id="parent"
              value={parent}
              onValueChange={setParent}
              options={[
                { value: "none", label: "無（第一層）" },
                ...categories
                  .filter((c) => c.id !== category?.id)
                  .map((c) => ({
                    value: c.id,
                    label: categoryLabel(c.id, categories),
                  })),
              ]}
            />
          </FormField>
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
          <Button form="category-editor-form" type="submit" disabled={pending}>
            儲存分類
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
