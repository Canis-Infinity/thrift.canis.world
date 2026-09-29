"use client"
import Link from "next/link"
import { useState } from "react"
import {
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Package,
  Tags,
  ClipboardList,
  Settings,
} from "lucide-react"
import { useStore } from "@/components/providers"
import { useData } from "@/hooks/use-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EmptyState } from "@/components/empty-state"
import { PageSkeleton } from "@/components/page-skeleton"
import { ConfirmDelete } from "@/components/confirm-delete"
import { ProductEditor } from "@/components/product-editor"
import { CategoryEditor } from "@/components/category-editor"
import { OrderEditor } from "@/components/order-editor"
import { categoryLabel } from "@/components/catalog"
import { send } from "@/lib/api"
import { mutation } from "@/lib/notifications"
import {
  money,
  statuses,
  type AdminData,
  type Product,
  type Category,
  type Order,
} from "@/lib/types"
type Editor =
  | { type: "product"; value?: Product }
  | { type: "category"; value?: Category }
  | { type: "order"; value?: Order }
export function AdminPage() {
  const { user, loading: authLoading } = useStore(),
    { data, loading, error, reload } = useData<AdminData>(
      user?.role === "admin" ? "/admin/data" : null
    ),
    [editor, setEditor] = useState<Editor | null>(null),
    [deletion, setDeletion] = useState<{
      path: string
      version: number
      title: string
      description?: string
    } | null>(null),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false)
  if (authLoading || (user?.role === "admin" && loading))
    return <PageSkeleton list />
  if (user?.role !== "admin")
    return (
      <EmptyState title="此頁面僅供管理員使用">
        <Button render={<Link href="/login" />}>登入</Button>
      </EmptyState>
    )
  if (error || !data)
    return (
      <EmptyState title="管理資料無法載入" description={error}>
        <Button onClick={reload}>重新載入</Button>
      </EmptyState>
    )
  const matches = (s: string) => s.toLowerCase().includes(search.toLowerCase()),
    products = data.products.filter((p) => matches(p.name)),
    orders = data.orders.filter((o) =>
      matches(`${o.number} ${o.customer.name} ${o.customer.contact.account}`)
    ),
    users = data.users.filter((u) => matches(`${u.name} ${u.email}`))
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground">
            SHOP MANAGEMENT
          </p>
          <h1 className="mt-2 text-3xl font-semibold">商店管理</h1>
        </div>
        <Button variant="outline" render={<Link href="/settings" />}>
          <Settings />
          帳號設定
        </Button>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-6 border-y py-6 sm:grid-cols-4">
        {[
          ["上架商品", data.products.filter((p) => p.active).length],
          [
            "待聯繫訂單",
            data.orders.filter((o) => o.status === "pending").length,
          ],
          ["商品分類", data.categories.length],
          ["註冊會員", data.users.filter((u) => u.role === "user").length],
        ].map(([label, count]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 font-mono text-2xl">{count}</p>
          </div>
        ))}
      </div>
      <Tabs defaultValue="products">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="products">
              <Package />
              <span>商品</span>
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tags />
              <span>分類</span>
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ClipboardList />
              <span>訂單</span>
            </TabsTrigger>
            <TabsTrigger value="users">
              <UserRound />
              <span>帳號</span>
            </TabsTrigger>
          </TabsList>
          <Input
            aria-label="搜尋管理資料"
            placeholder="搜尋名稱、信箱或訂單編號"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>
        <TabsContent value="products">
          <div className="mb-5 flex justify-end">
            <Button onClick={() => setEditor({ type: "product" })}>
              <Plus />
              新增商品
            </Button>
          </div>
          {!products.length ? (
            <EmptyState title="尚無商品" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>庫存</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="max-w-64 truncate font-medium">{p.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.category
                          ? categoryLabel(p.category, data.categories)
                          : "未分類"}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono">
                      {money(p.price)}
                    </TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {p.active ? "上架" : "下架"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`編輯 ${p.name}`}
                          onClick={() =>
                            setEditor({ type: "product", value: p })
                          }
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`刪除 ${p.name}`}
                          onClick={() =>
                            setDeletion({
                              path: `products/${p.id}`,
                              version: p.version,
                              title: `刪除「${p.name}」？`,
                              description:
                                "商品將從網站移除；已成立訂單保留商品名稱與單價。",
                            })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        <TabsContent value="categories">
          <div className="mb-5 flex justify-end">
            <Button onClick={() => setEditor({ type: "category" })}>
              <Plus />
              新增分類
            </Button>
          </div>
          {!data.categories.length ? (
            <EmptyState title="尚無分類" />
          ) : (
            <div className="divide-y">
              {data.categories
                .filter((c) => matches(c.name))
                .map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-4">
                    <p className="flex-1 text-sm">
                      {categoryLabel(c.id, data.categories)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`編輯分類 ${c.name}`}
                      onClick={() => setEditor({ type: "category", value: c })}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`刪除分類 ${c.name}`}
                      onClick={() =>
                        setDeletion({
                          path: `categories/${c.id}`,
                          version: c.version,
                          title: `刪除分類「${c.name}」？`,
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="orders">
          <div className="mb-5 flex justify-end">
            <Button onClick={() => setEditor({ type: "order" })}>
              <Plus />
              新增訂單
            </Button>
          </div>
          {!orders.length ? (
            <EmptyState title="尚無訂單" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>訂單編號</TableHead>
                  <TableHead>顧客</TableHead>
                  <TableHead>合計</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/order/${o.token}`}
                        className="font-mono text-xs underline underline-offset-4"
                      >
                        {o.number}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString("zh-TW")}
                      </p>
                    </TableCell>
                    <TableCell>
                      {o.customer.name}
                      <p className="max-w-48 truncate text-xs text-muted-foreground">
                        {o.customer.contact.platform} ·{" "}
                        {o.customer.contact.account}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono">
                      {money(o.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{statuses[o.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`編輯訂單 ${o.number}`}
                          onClick={() => setEditor({ type: "order", value: o })}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`刪除訂單 ${o.number}`}
                          onClick={() =>
                            setDeletion({
                              path: `orders/${o.id}`,
                              version: o.version,
                              title: "刪除這筆訂單？",
                              description:
                                "僅已取消並補回庫存的訂單可刪除。刪除後私密查詢連結將失效。",
                            })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        <TabsContent value="users">
          {!users.length ? (
            <EmptyState title="沒有符合的帳號" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名 / 信箱</TableHead>
                  <TableHead>聯繫方式</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      {u.name}
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{u.phone}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.contact?.platform} · {u.contact?.account}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {u.role === "admin"
                          ? "管理員"
                          : u.status === "active"
                            ? "啟用"
                            : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.role !== "admin" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true)
                              try {
                                await mutation(
                                  "更新帳號中…",
                                  "帳號狀態已更新",
                                  () =>
                                    send(`/admin/users/${u.id}`, "PATCH", {
                                      status:
                                        u.status === "active"
                                          ? "suspended"
                                          : "active",
                                      version: u.version,
                                    })
                                )
                                reload()
                              } catch {
                              } finally {
                                setBusy(false)
                              }
                            }}
                          >
                            {u.status === "active" ? "停用" : "啟用"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`刪除帳號 ${u.name}`}
                            onClick={() =>
                              setDeletion({
                                path: `users/${u.id}`,
                                version: u.version,
                                title: `刪除帳號「${u.name}」？`,
                                description: "登入權限將撤銷，既有訂單保留。",
                              })
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
      {editor?.type === "product" && (
        <ProductEditor
          product={editor.value}
          categories={data.categories}
          onClose={() => setEditor(null)}
          onSaved={reload}
        />
      )}{" "}
      {editor?.type === "category" && (
        <CategoryEditor
          category={editor.value}
          categories={data.categories}
          onClose={() => setEditor(null)}
          onSaved={reload}
        />
      )}{" "}
      {editor?.type === "order" && (
        <OrderEditor
          order={editor.value}
          products={data.products}
          onClose={() => setEditor(null)}
          onSaved={reload}
        />
      )}{" "}
      {deletion && (
        <ConfirmDelete
          title={deletion.title}
          description={deletion.description}
          onClose={() => setDeletion(null)}
          onConfirm={async () => {
            await send(`/admin/${deletion.path}`, "DELETE", {
              version: deletion.version,
            })
            reload()
          }}
        />
      )}
    </>
  )
}
