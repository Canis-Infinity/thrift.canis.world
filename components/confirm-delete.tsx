"use client"
import { useState } from "react"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog"
import { FieldError } from "@/components/ui/field"
import { mutation } from "@/lib/notifications"
export function ConfirmDelete({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string
  description?: string
  onConfirm: () => Promise<unknown> | void
  onClose: () => void
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("")
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || "此操作無法復原，請確認後再繼續。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={async (e) => {
              e.preventDefault()
              setPending(true)
              try {
                await mutation("刪除中…", "已刪除", async () => onConfirm())
                onClose()
              } catch (e) {
                setError(e instanceof Error ? e.message : "刪除失敗")
              } finally {
                setPending(false)
              }
            }}
          >
            {pending ? "刪除中…" : "確認刪除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
