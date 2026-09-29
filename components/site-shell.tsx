"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ArrowUpRight,
  Menu,
  Moon,
  Recycle,
  ShoppingBag,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteFooter } from "@/components/site-footer"
import { useStore } from "@/components/providers"
import { api } from "@/lib/api"
import { mutation } from "@/lib/notifications"
const names: Record<string, string> = {
  "/": "探索物品",
  "/login": "登入",
  "/register": "註冊",
  "/cart": "購物車",
  "/orders": "我的訂單",
  "/settings": "帳號設定",
  "/admin": "商店管理",
}
function Navigation() {
  const { user, setUser, loading, cart, cartReady } = useStore(),
    { setTheme, resolvedTheme } = useTheme(),
    path = usePathname(),
    { toggleSidebar, setOpenMobile } = useSidebar()
  const links = [
    { href: "/", label: "探索物品" },
    ...(user
      ? [
          { href: "/orders", label: "我的訂單" },
          { href: "/settings", label: "帳號設定" },
        ]
      : [{ href: "/login", label: "登入 / 註冊" }]),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "商店管理" }] : []),
  ]
  return (
    <>
      <Sidebar collapsible="offcanvas" className="md:hidden">
        <SidebarHeader className="p-6 font-semibold">
          THRIFT / 二手好物
        </SidebarHeader>
        <SidebarContent className="px-3">
          <SidebarMenu>
            {[...links, { href: "/cart", label: "購物車" }].map((l) => (
              <SidebarMenuItem key={l.href}>
                <SidebarMenuButton
                  render={<Link href={l.href} />}
                  isActive={path === l.href}
                  onClick={() => setOpenMobile(false)}
                >
                  {l.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-5 sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="開啟導覽列"
            onClick={toggleSidebar}
          >
            <Menu />
          </Button>
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Recycle className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-[.16em]">
              THRIFT
              <span className="mt-0.5 block text-[10px] font-normal tracking-[.2em] text-muted-foreground">
                BY CANIS
              </span>
            </span>
          </Link>
          <nav
            className="ml-auto hidden items-center gap-6 text-sm md:flex"
            aria-label="主要導覽"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  path === l.href
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="切換明暗主題"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <Sun className="dark:hidden" />
              <Moon className="hidden dark:block" />
            </Button>
            <Button variant="outline" render={<Link href="/cart" />}>
              <ShoppingBag />
              <span className="hidden sm:inline">購物車</span>
              <span>
                {cartReady ? cart.reduce((n, i) => n + i.quantity, 0) : "–"}
              </span>
            </Button>
            {loading ? (
              <Skeleton className="hidden h-8 w-12 lg:block" />
            ) : (
              user && (
                <Button
                  variant="ghost"
                  className="hidden lg:flex"
                  onClick={async () => {
                    try {
                      await mutation("登出中…", "已登出", () =>
                        api("/auth/logout", { method: "POST", body: "{}" })
                      )
                      setUser(null)
                    } catch {}
                  }}
                >
                  登出
                </Button>
              )
            )}
          </div>
        </div>
      </header>
    </>
  )
}
export function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <SidebarProvider defaultOpen={false} className="block min-h-svh">
      <Navigation />
      <main
        id="main"
        className="mx-auto min-h-[calc(100svh-162px)] max-w-7xl px-5 pb-20 sm:px-8"
      >
        <Breadcrumb className="py-7">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>
                二手好物
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {names[path] ||
                  (path.startsWith("/order/") ? "訂單詳情" : "物品詳情")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {children}
      </main>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8">
          <p className="text-muted-foreground">讓喜歡的物品，繼續被喜歡。</p>
          <Link href="/" className="flex items-center gap-2">
            尋找下一件好物 <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
      <SiteFooter />
    </SidebarProvider>
  )
}
