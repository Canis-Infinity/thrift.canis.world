"use client"
import { useState } from "react"
import { z } from "zod"
import { ApiError } from "@/lib/api"
import { mutation } from "@/lib/notifications"
import { toast } from "@/components/ui/toast"
export function useForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  async function submit<T>(
    schema: z.ZodType<T>,
    input: unknown,
    action: (data: T) => Promise<unknown>,
    success = "已儲存"
  ) {
    if (pending) return
    const result = schema.safeParse(input)
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((i) => [i.path.join("."), i.message])
        )
      )
      toast.add({ title: "請檢查必填欄位及輸入內容", type: "error" })
      return
    }
    setPending(true)
    setErrors({})
    try {
      await mutation("處理中…", success, () => action(result.data))
    } catch (e) {
      setErrors({
        ...(e instanceof ApiError
          ? Object.fromEntries(
              Object.entries(e.fields).map(([k, v]) => [k, v.join("、")])
            )
          : {}),
        form: e instanceof Error ? e.message : "操作失敗",
      })
    } finally {
      setPending(false)
    }
  }
  return { errors, pending, submit }
}
