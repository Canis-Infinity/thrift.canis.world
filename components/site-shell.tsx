"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ArrowUpRight,
  Compass,
  LogIn,
  LogOut,
  ReceiptText,
  Settings,
  Store,
  Package,
  Tags,
  Users,
  X,
  Moon,
  ShoppingBag,
  Sun,
} from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Brand } from "@/components/brand"
import { DesktopTooltip } from "@/components/desktop-tooltip"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarTrigger,
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
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteFooter } from "@/components/site-footer"
import { useStore } from "@/components/providers"
import { api } from "@/lib/api"
import { mutation } from "@/lib/notifications"
const names: Record<string, string> = {
  "/": "商品列表",
  "/offline": "目前離線",
  "/login": "登入",
  "/register": "註冊",
  "/cart": "購物車",
  "/orders": "我的訂單",
  "/settings": "帳號設定",
  "/admin": "商店管理",
  "/admin/products": "商品管理",
  "/admin/categories": "分類管理",
  "/admin/orders": "訂單管理",
  "/admin/users": "帳號管理",
}
const adminLinks = [
  {
    href: "/admin/products",
    label: "商品管理",
    description: "上架、編輯商品與庫存",
    icon: Package,
  },
  {
    href: "/admin/categories",
    label: "分類管理",
    description: "整理商品分類與子分類",
    icon: Tags,
  },
  {
    href: "/admin/orders",
    label: "訂單管理",
    description: "查看、修改與處理訂單",
    icon: ReceiptText,
  },
  {
    href: "/admin/users",
    label: "帳號管理",
    description: "管理會員狀態與權限",
    icon: Users,
  },
]
function Navigation() {
  const { user, setUser, loading, cart, cartReady } = useStore(),
    { setTheme, resolvedTheme } = useTheme(),
    path = usePathname(),
    { isMobile, openMobile, setOpenMobile } = useSidebar()
  const [signingOut, setSigningOut] = useState(false)
  const links = [
    { href: "/", label: "商品列表", icon: Compass },
    ...(user
      ? [
          { href: "/orders", label: "我的訂單", icon: ReceiptText },
          { href: "/settings", label: "帳號設定", icon: Settings },
        ]
      : [{ href: "/login", label: "登入 / 註冊", icon: LogIn }]),
  ]
  const isActive = (href: string) =>
    path === href || (href === "/login" && path === "/register")
  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await mutation("登出中…", "已登出", () =>
        api("/auth/logout", { method: "POST", body: "{}" })
      )
      setUser(null)
      setOpenMobile(false)
    } catch {
    } finally {
      setSigningOut(false)
    }
  }
  return (
    <>
      {isMobile && (
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="flex-row items-center justify-between p-4">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="inline-flex items-center"
            >
              <Brand />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="關閉導覽列"
              onClick={() => setOpenMobile(false)}
            >
              <X />
            </Button>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>主要導覽</SidebarGroupLabel>
              <nav aria-label="手機導覽">
                <SidebarMenu>
                  {links.map((l) => (
                    <SidebarMenuItem key={l.href}>
                      <SidebarMenuButton
                        render={<Link href={l.href} />}
                        isActive={isActive(l.href)}
                        aria-current={isActive(l.href) ? "page" : undefined}
                        onClick={() => setOpenMobile(false)}
                      >
                        <l.icon />
                        <span>{l.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </nav>
            </SidebarGroup>
            {user?.role === "admin" && (
              <SidebarGroup>
                <SidebarGroupLabel>商店管理</SidebarGroupLabel>
                <nav aria-label="手機商店管理">
                  <SidebarMenu>
                    {adminLinks.map((l) => (
                      <SidebarMenuItem key={l.href}>
                        <SidebarMenuButton
                          render={<Link href={l.href} />}
                          isActive={isActive(l.href)}
                          aria-current={isActive(l.href) ? "page" : undefined}
                          onClick={() => setOpenMobile(false)}
                        >
                          <l.icon />
                          <span>{l.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </nav>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter className="gap-3 p-4">
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : user ? (
              <>
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === "admin" ? "商店管理員" : "會員"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled={signingOut}
                  onClick={signOut}
                >
                  {signingOut ? <Spinner /> : <LogOut />}
                  {signingOut ? "登出中…" : "登出"}
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                付款與交付方式請私訊確認。
              </p>
            )}
          </SidebarFooter>
        </Sidebar>
      )}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center gap-2 px-5 py-3 sm:px-8 lg:gap-4">
          <SidebarTrigger
            className="md:hidden"
            aria-label="開啟導覽列"
            aria-expanded={openMobile}
          />
          <Link href="/" className="flex shrink-0 items-center gap-2 lg:gap-3">
            <Brand />
          </Link>
          <NavigationMenu
            className="ml-auto hidden md:flex"
            aria-label="主要導覽"
            align="end"
          >
            <NavigationMenuList>
              {loading ? (
                <NavigationMenuItem>
                  <Skeleton className="h-9 w-64" />
                </NavigationMenuItem>
              ) : (
                <>
                  {links.map((l) => (
                    <NavigationMenuItem key={l.href}>
                      <NavigationMenuLink
                        render={<Link href={l.href} />}
                        active={isActive(l.href)}
                        className={navigationMenuTriggerStyle()}
                      >
                        <l.icon className="hidden lg:block" />
                        {l.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                  {user?.role === "admin" && (
                    <NavigationMenuItem>
                      <NavigationMenuTrigger
                        className={
                          path.startsWith("/admin") ? "gap-2 bg-muted" : "gap-2"
                        }
                      >
                        <Store className="hidden size-4 lg:block" />
                        商店管理
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-80 gap-1 p-2">
                          {adminLinks.map((l) => (
                            <li key={l.href}>
                              <NavigationMenuLink
                                render={<Link href={l.href} />}
                                active={isActive(l.href)}
                              >
                                <l.icon className="shrink-0" />
                                <div>
                                  <p className="font-medium">{l.label}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {l.description}
                                  </p>
                                </div>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  )}
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="ml-auto shrink-0 md:ml-0 md:border-l md:pl-3">
            <DesktopTooltip label="查看購物車">
              <Button
                variant={path === "/cart" ? "secondary" : "outline"}
                size="lg"
                render={<Link href="/cart" />}
                aria-label="購物車"
                aria-current={path === "/cart" ? "page" : undefined}
              >
                <ShoppingBag />
                <span className="hidden xl:inline">購物車</span>
                <span>
                  {cartReady ? cart.reduce((n, i) => n + i.quantity, 0) : "–"}
                </span>
              </Button>
            </DesktopTooltip>
          </div>
          <div className="flex shrink-0 items-center gap-1 border-l pl-2 md:pl-3">
            <DesktopTooltip label="切換明暗主題">
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label="切換明暗主題"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                <Sun className="dark:hidden" />
                <Moon className="hidden dark:block" />
              </Button>
            </DesktopTooltip>
            {!loading && user && (
              <DesktopTooltip label="登出">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden size-9 md:flex"
                  aria-label={signingOut ? "登出中…" : "登出"}
                  disabled={signingOut}
                  onClick={signOut}
                >
                  {signingOut ? <Spinner /> : <LogOut />}
                </Button>
              </DesktopTooltip>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
export function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const { isOfflinePage } = useStore()
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
                二手物品
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {!isOfflinePage && path.startsWith("/admin/") && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/admin" />}>
                    商店管理
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isOfflinePage
                  ? "目前離線"
                  : names[path] ||
                    (path.startsWith("/order/") ? "訂單詳情" : "物品詳情")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {children}
      </main>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8">
          <p className="text-muted-foreground">付款與交付方式請私訊確認。</p>
          <Link href="/" className="flex items-center gap-2">
            查看商品 <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
      <SiteFooter />
    </SidebarProvider>
  )
}
