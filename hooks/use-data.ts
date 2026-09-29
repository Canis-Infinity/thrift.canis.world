"use client"
import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { toast } from "@/components/ui/toast"
export function useData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((v) => v + 1), [])
  useEffect(() => {
    if (!path) return
    let alive = true
    api<T>(path)
      .then((d) => {
        if (alive) {
          setData(d)
          setError("")
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message)
          toast.add({ title: e.message, type: "error" })
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [path, revision])
  return { data, error, loading, reload }
}
