"use client"
import { DataTable } from "@/components/data-table"
import Link from "next/link"
import {
  memo,
  useDeferredValue,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useStore } from "@/components/providers"
import { useData } from "@/hooks/use-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { PageSkeleton } from "@/components/page-skeleton"
import { ConfirmDelete } from "@/components/confirm-delete"
import { ProductEditor } from "@/components/product-editor"
import { ProductImage } from "@/components/product-image"
import { ProductStatusButton } from "@/components/product-status-button"
import { CategoryEditor } from "@/components/category-editor"
import { OrderEditor } from "@/components/order-editor"
import { categoryLabel } from "@/lib/categories"
import { send } from "@/lib/api"
import { mutation } from "@/lib/notifications"
import {
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
const sections = {
  products: { title: "商品管理", search: "搜尋商品名稱" },
  categories: { title: "分類管理", search: "搜尋分類名稱" },
  orders: { title: "訂單管理", search: "搜尋顧客、聯絡帳號或訂單編號" },
  users: { title: "帳號管理", search: "搜尋姓名或信箱" },
}
export function AdminPage({ section }: { section: keyof typeof sections }) {
  const { user, loading: authLoading } = useStore(),
    { data, loading, error, reload } = useData<AdminData>(
      user?.role === "admin" ? `/admin/data?section=${section}` : null
    ),
    [editor, setEditor] = useState<Editor | null>(null),
    [deletion, setDeletion] = useState<Deletion | null>(null),
    [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const sectionInfo = sections[section]
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
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{sectionInfo.title}</h1>
        {section === "products" && (
          <Button
            className="shrink-0"
            onClick={() => setEditor({ type: "product" })}
          >
            <Plus />
            新增商品
          </Button>
        )}
        {section === "categories" && (
          <Button
            className="shrink-0"
            onClick={() => setEditor({ type: "category" })}
          >
            <Plus />
            新增分類
          </Button>
        )}
        {section === "orders" && (
          <Button
            className="shrink-0"
            onClick={() => setEditor({ type: "order" })}
          >
            <Plus />
            新增訂單
          </Button>
        )}
      </div>
      <div className="mb-6">
        <Input
          aria-label="搜尋管理資料"
          placeholder={sectionInfo.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>
      <AdminListings
        section={section}
        data={data}
        search={deferredSearch}
        setEditor={setEditor}
        setDeletion={setDeletion}
        reload={reload}
      />
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

type Deletion = {
  path: string
  version: number
  title: string
  description?: string
}
// Dialog state stays above this boundary: opening an editor must not rebuild all rows.
const AdminListings = memo(function AdminListings({
  section,
  data,
  search,
  setEditor,
  setDeletion,
  reload,
}: {
  section: keyof typeof sections
  data: AdminData
  search: string
  setEditor: Dispatch<SetStateAction<Editor | null>>
  setDeletion: Dispatch<SetStateAction<Deletion | null>>
  reload: () => void
}) {
  const [busy, setBusy] = useState(false)
  const sectionInfo = sections[section]
  const query = search.toLowerCase()
  const matches = (value: string) => value.toLowerCase().includes(query)
  const products =
    section === "products" ? data.products.filter((p) => matches(p.name)) : []
  const categories =
    section === "categories"
      ? data.categories.filter((c) => matches(c.name))
      : []
  const orders =
    section === "orders"
      ? data.orders.filter((o) =>
          matches(
            `${o.number} ${o.customer.name} ${o.customer.contact.account}`
          )
        )
      : []
  const users =
    section === "users"
      ? data.users.filter((u) => matches(`${u.name} ${u.email}`))
      : []
  return (
    <>
      {section === "products" && (
        <section aria-label={sectionInfo.title}>
          {!products.length ? (
            <EmptyState title="尚無商品" />
          ) : (
            <DataTable
              data={products}
              filterKey={search}
              columns={[
                {
                  id: "column0",
                  header: "商品",
                  accessorFn: (p) => p.name,
                  cell: ({ row }) => {
                    const p = row.original
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <ProductImage
                            key={p.images[0]}
                            id={p.images[0]}
                            name={p.name}
                            thumbnail
                          />
                          <div>
                            <p className="max-w-64 truncate font-medium">
                              {p.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {p.category
                                ? categoryLabel(p.category, data.categories)
                                : "未分類"}
                            </p>
                          </div>
                        </div>
                      </>
                    )
                  },
                },
                {
                  id: "column1",
                  header: "金額",
                  accessorFn: (p) => p.price,
                  cell: ({ row }) => {
                    const p = row.original
                    return (
                      <div className="font-mono">
                        {new Intl.NumberFormat("zh-TW").format(p.price)}
                      </div>
                    )
                  },
                },
                {
                  id: "column2",
                  header: "庫存",
                  accessorFn: (p) => p.quantity,
                  cell: ({ row }) => {
                    const p = row.original
                    return <>{p.quantity}</>
                  },
                },
                {
                  id: "column3",
                  header: "狀態",
                  accessorFn: (p) => (p.active ? "上架" : "下架"),
                  cell: ({ row }) => {
                    const p = row.original
                    return (
                      <>
                        <Badge variant={p.active ? "default" : "secondary"}>
                          {p.active ? "上架" : "下架"}
                        </Badge>
                      </>
                    )
                  },
                },
                {
                  id: "actions",
                  header: "操作",
                  enableSorting: false,
                  cell: ({ row }) => {
                    const p = row.original
                    return (
                      <>
                        <div className="flex justify-end gap-1">
                          <ProductStatusButton product={p} onSaved={reload} />
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
                      </>
                    )
                  },
                },
              ]}
            />
          )}
        </section>
      )}
      {section === "categories" && (
        <section aria-label={sectionInfo.title}>
          {!categories.length ? (
            <EmptyState title="尚無分類" />
          ) : (
            <DataTable
              data={categories}
              filterKey={search}
              columns={[
                {
                  id: "column0",
                  header: "分類名稱",
                  accessorFn: (c) => c.name,
                  cell: ({ row }) => {
                    const c = row.original
                    return <div className="font-medium">{c.name}</div>
                  },
                },
                {
                  id: "column1",
                  header: "上層分類",
                  accessorFn: (c) =>
                    c.parent
                      ? categoryLabel(c.parent, data.categories)
                      : "無（第一層）",
                  cell: ({ row }) => {
                    const c = row.original
                    return (
                      <div className="text-muted-foreground">
                        {c.parent
                          ? categoryLabel(c.parent, data.categories)
                          : "無（第一層）"}
                      </div>
                    )
                  },
                },
                {
                  id: "actions",
                  header: "操作",
                  enableSorting: false,
                  cell: ({ row }) => {
                    const c = row.original
                    return (
                      <>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`編輯分類 ${c.name}`}
                            onClick={() =>
                              setEditor({ type: "category", value: c })
                            }
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
                      </>
                    )
                  },
                },
              ]}
            />
          )}
        </section>
      )}
      {section === "orders" && (
        <section aria-label={sectionInfo.title}>
          {!orders.length ? (
            <EmptyState title="尚無訂單" />
          ) : (
            <DataTable
              data={orders}
              filterKey={search}
              columns={[
                {
                  id: "column0",
                  header: "訂單編號",
                  accessorFn: (o) => o.number,
                  cell: ({ row }) => {
                    const o = row.original
                    return (
                      <>
                        <Link
                          href={`/order/${o.token}`}
                          className="font-mono text-xs underline underline-offset-4"
                        >
                          {o.number}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleString("zh-TW")}
                        </p>
                      </>
                    )
                  },
                },
                {
                  id: "column1",
                  header: "顧客",
                  accessorFn: (o) => o.customer.name,
                  cell: ({ row }) => {
                    const o = row.original
                    return (
                      <>
                        {o.customer.name}
                        <p className="max-w-48 truncate text-xs text-muted-foreground">
                          {o.customer.contact.platform} ·{" "}
                          {o.customer.contact.account}
                        </p>
                      </>
                    )
                  },
                },
                {
                  id: "column2",
                  header: "合計",
                  accessorFn: (o) => o.total,
                  cell: ({ row }) => {
                    const o = row.original
                    return (
                      <div className="font-mono">
                        {new Intl.NumberFormat("zh-TW").format(o.total)}
                      </div>
                    )
                  },
                },
                {
                  id: "column3",
                  header: "狀態",
                  accessorFn: (o) => statuses[o.status],
                  cell: ({ row }) => {
                    const o = row.original
                    return (
                      <>
                        <Badge variant="secondary">{statuses[o.status]}</Badge>
                      </>
                    )
                  },
                },
                {
                  id: "actions",
                  header: "操作",
                  enableSorting: false,
                  cell: ({ row }) => {
                    const o = row.original
                    return (
                      <>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`編輯訂單 ${o.number}`}
                            onClick={() =>
                              setEditor({ type: "order", value: o })
                            }
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
                      </>
                    )
                  },
                },
              ]}
            />
          )}
        </section>
      )}
      {section === "users" && (
        <section aria-label={sectionInfo.title}>
          {!users.length ? (
            <EmptyState title="沒有符合的帳號" />
          ) : (
            <DataTable
              data={users}
              filterKey={search}
              columns={[
                {
                  id: "column0",
                  header: "姓名 / 信箱",
                  accessorFn: (u) => u.name,
                  cell: ({ row }) => {
                    const u = row.original
                    return (
                      <>
                        {u.name}
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </>
                    )
                  },
                },
                {
                  id: "column1",
                  header: "聯繫方式",
                  accessorFn: (u) =>
                    `${u.phone} ${u.contact?.platform || ""} ${u.contact?.account || ""}`,
                  cell: ({ row }) => {
                    const u = row.original
                    return (
                      <>
                        <p className="text-sm">{u.phone}</p>
                        {u.contact?.account && (
                          <p className="text-xs text-muted-foreground">
                            {[u.contact.platform, u.contact.account]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </>
                    )
                  },
                },
                {
                  id: "column2",
                  header: "狀態",
                  accessorFn: (u) =>
                    u.role === "admin"
                      ? "管理員"
                      : u.status === "active"
                        ? "啟用"
                        : "停用",
                  cell: ({ row }) => {
                    const u = row.original
                    return (
                      <>
                        <Badge variant="secondary">
                          {u.role === "admin"
                            ? "管理員"
                            : u.status === "active"
                              ? "啟用"
                              : "停用"}
                        </Badge>
                      </>
                    )
                  },
                },
                {
                  id: "actions",
                  header: "操作",
                  enableSorting: false,
                  cell: ({ row }) => {
                    const u = row.original
                    return (
                      <>
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
                      </>
                    )
                  },
                },
              ]}
            />
          )}
        </section>
      )}
    </>
  )
})
