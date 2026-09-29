"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster, toast } from "@/components/ui/toast"
import { ApiError, api } from "@/lib/api"
import type { CartItem, User } from "@/lib/types"
import { z } from "zod"
type Context = {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
  cart: CartItem[]
  setCart: (cart: CartItem[]) => void
  cartReady: boolean
}
const StoreContext = createContext<Context | null>(null)
export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [cart, updateCart] = useState<CartItem[]>([]),
    [cartReady, setCartReady] = useState(false)
  useEffect(() => {
    let alive = true
    api<{ user: User }>("/auth/me")
      .then((d) => {
        if (alive) setUser(d.user)
      })
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401))
          toast.add({ title: e.message, type: "error" })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    const expire = () => setUser(null)
    window.addEventListener("thrift-session-expired", expire)
    try {
      const stored = z
        .array(
          z.object({
            product: z.string(),
            quantity: z.number().int().min(1).max(99999),
          })
        )
        .max(50)
        .parse(JSON.parse(localStorage.getItem("thrift-cart") || "[]"))
      updateCart(stored)
    } catch {
      /* Recover an invalid local cart. */
    }
    setCartReady(true)
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    return () => {
      alive = false
      window.removeEventListener("thrift-session-expired", expire)
    }
  }, [])
  function setCart(next: CartItem[]) {
    updateCart(next)
    try {
      localStorage.setItem("thrift-cart", JSON.stringify(next))
    } catch {
      toast.add({
        title: "瀏覽器無法保存購物車，關閉分頁後可能遺失",
        type: "warning",
      })
    }
  }
  return (
    <ThemeProvider>
      <Toaster>
        <StoreContext.Provider
          value={{ user, setUser, loading, cart, setCart, cartReady }}
        >
          {children}
        </StoreContext.Provider>
      </Toaster>
    </ThemeProvider>
  )
}
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("Providers required")
  return ctx
}
