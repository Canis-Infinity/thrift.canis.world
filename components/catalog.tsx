"use client"
import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { AppSelect } from "@/components/app-select"
import { PageSkeleton } from "@/components/page-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ProductImage } from "@/components/product-image"
import { ProductDialog } from "@/components/product-dialog"
import { useData } from "@/hooks/use-data"
import { money, type Catalog as CatalogData, type Product } from "@/lib/types"
export function Catalog() {
  const { data, loading, error, reload } = useData<CatalogData>("/catalog"),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [sort, setSort] = useState("new"),
    [selected, setSelected] = useState<Product | null>(null)
  const products = useMemo(() => {
    const cats = new Set([category])
    for (let i = 0; i < 3; i++)
      data?.categories.forEach((c) => {
        if (c.parent && cats.has(c.parent)) cats.add(c.id)
      })
    return (data?.products || [])
      .filter(
        (p) =>
          (category === "all" || (p.category && cats.has(p.category))) &&
          `${p.name} ${p.tags.join(" ")} ${p.description}`
            .toLowerCase()
            .includes(search.toLowerCase())
      )
      .sort((a, b) =>
        sort === "low"
          ? a.price - b.price
          : sort === "high"
            ? b.price - a.price
            : b.createdAt.localeCompare(a.createdAt)
      )
  }, [data, search, category, sort])
  if (loading) return <PageSkeleton />
  if (error)
    return (
      <EmptyState title="物品暫時無法載入" description={error}>
        <Button onClick={reload}>重新載入</Button>
      </EmptyState>
    )
  return (
    <>
      <section className="relative mb-12 overflow-hidden rounded-2xl bg-muted px-7 py-12 sm:px-12 sm:py-16">
        <div className="relative z-10 max-w-xl">
          <p className="mb-6 text-xs tracking-[.2em] text-muted-foreground">
            LESS WASTE. MORE STORIES.
          </p>
          <h1 className="text-4xl leading-[1.2] font-semibold tracking-tight sm:text-6xl">
            讓好物，
            <br />
            遇見下一個日常<span className="text-muted-foreground">。</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
            每件物品都有故事，也值得新的開始。
            <br />
            在這裡，找到你剛好需要的那一件。
          </p>
          <Button className="mt-8" render={<a href="#collection" />}>
            探索所有物品 <ArrowDown className="size-4" />
          </Button>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-10 -bottom-16 hidden size-96 items-center justify-center rounded-full border-[56px] border-background/50 lg:flex"
        >
          <ArrowUpRight className="size-36 stroke-[.7] text-foreground/20" />
        </div>
        <span className="absolute right-8 bottom-6 text-[10px] tracking-[.2em] text-muted-foreground">
          THE SECONDHAND COLLECTION
        </span>
      </section>
      <section id="collection" className="scroll-mt-28">
        <div className="mb-7 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest text-muted-foreground">
              FIND YOUR NEXT FAVORITE
            </p>
            <h2 className="mt-2 text-2xl font-semibold">慢慢逛，找到剛剛好</h2>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {products.length} 件物品
          </span>
        </div>
        <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_180px_160px]">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="搜尋物品"
              placeholder="搜尋物品名稱、標籤…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <AppSelect
            label="商品分類"
            value={category}
            onValueChange={setCategory}
            options={[
              { value: "all", label: "所有分類", icon: SlidersHorizontal },
              ...(data?.categories || []).map((c) => ({
                value: c.id,
                label: categoryLabel(c.id, data?.categories || []),
              })),
            ]}
          />
          <AppSelect
            label="排序方式"
            value={sort}
            onValueChange={setSort}
            options={[
              { value: "new", label: "最新上架" },
              { value: "low", label: "價格：低到高" },
              { value: "high", label: "價格：高到低" },
            ]}
          />
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:gap-x-7 lg:grid-cols-3">
            {products.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className="group min-w-0 text-left outline-offset-4"
                onClick={() => setSelected(p)}
              >
                <ProductImage id={p.images[0]} name={p.name} priority={i < 3} />
                <div className="mt-4 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-medium sm:text-base">
                    {p.name}
                  </h3>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm sm:text-base">
                    {money(p.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.quantity ? `剩餘 ${p.quantity} 件` : "已售完"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title={data?.products.length ? "找不到符合的物品" : "好物準備中"}
            description={
              data?.products.length
                ? "試試其他關鍵字或分類。"
                : "目前還沒有上架的物品，歡迎稍後再來看看。"
            }
          >
            {!!data?.products.length && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setCategory("all")
                }}
              >
                清除篩選
              </Button>
            )}
          </EmptyState>
        )}
      </section>
      {selected && (
        <ProductDialog product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
export function categoryLabel(
  id: string,
  categories: CatalogData["categories"]
): string {
  const c = categories.find((c) => c.id === id)
  return c
    ? `${c.parent ? `${categoryLabel(c.parent, categories)} / ` : ""}${c.name}`
    : "未分類"
}
