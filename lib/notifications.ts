"use client"

import { toast } from "@/components/ui/toast"

export async function mutation<T>(
  pending: string,
  success: string,
  action: () => Promise<T>
): Promise<T> {
  const id = toast.add({ title: pending, type: "loading", timeout: 0 })
  try {
    const result = await action()
    toast.update(id, { title: success, type: "success", timeout: 4000 })
    return result
  } catch (error) {
    toast.update(id, {
      title: error instanceof Error ? error.message : "操作失敗",
      type: "error",
      timeout: 7000,
    })
    throw error
  }
}
