"use client"
import { ListPagination, useListPagination } from "@/components/list-pagination"
import { memo, useMemo, useState } from "react"
import { z } from "zod"
import {
  ArrowDown,
  ArrowUpRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { AppSelect } from "@/components/app-select"
import { PageSkeleton } from "@/components/page-skeleton"
import { EmptyState } from "@/components/empty-state"
import { ProductImage } from "@/components/product-image"
import { categoryLabel } from "@/lib/categories"
import { ProductDialog } from "@/components/product-dialog"
import { useData } from "@/hooks/use-data"
import { money, type Catalog as CatalogData, type Product } from "@/lib/types"

const priceBound = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (/^\d+$/.test(value) && Number.isSafeInteger(Number(value))),
    "請輸入 0 以上的新臺幣整數"
  )
  .transform((value) => (value === "" ? undefined : Number(value)))
const priceRangeSchema = z
  .object({ min: priceBound, max: priceBound })
  .refine(
    ({ min, max }) => min === undefined || max === undefined || min <= max,
    "最高價格不能低於最低價格"
  )

const filterSchema = z.object({
  search: z.string(),
  category: z.string(),
  sort: z.enum(["new", "low", "high"]),
  hideSoldOut: z.boolean(),
  tag: z.string(),
  price: priceRangeSchema,
})
const initialFilters = {
  search: "",
  category: "all",
  sort: "new",
  hideSoldOut: false,
  tag: "",
  price: { min: "", max: "" },
}

export function Catalog() {
  const { data, loading, error, reload } = useData<CatalogData>("/catalog"),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [sort, setSort] = useState("new"),
    [hideSoldOut, setHideSoldOut] = useState(false),
    [tag, setTag] = useState(""),
    [priceDraft, setPriceDraft] = useState({ min: "", max: "" }),
    [applied, setApplied] = useState(() => filterSchema.parse(initialFilters)),
    [filtersOpen, setFiltersOpen] = useState(false),
    [priceError, setPriceError] = useState(""),
    [selected, setSelected] = useState<Product | null>(null)
  const tags = useMemo(
    () =>
      [...new Set(data?.products.flatMap((p) => p.tags) || [])].sort((a, b) =>
        a.localeCompare(b, "zh-TW")
      ),
    [data]
  )
  const hasFilters = !!(
    search ||
    category !== "all" ||
    tag ||
    hideSoldOut ||
    priceDraft.min ||
    priceDraft.max ||
    sort !== "new"
  )
  const pendingFilters = filterSchema.safeParse({
    search,
    category,
    sort,
    hideSoldOut,
    tag,
    price: priceDraft,
  })
  const hasPendingChanges =
    !pendingFilters.success ||
    JSON.stringify(pendingFilters.data) !== JSON.stringify(applied)
  const appliedCount = [
    applied.search,
    applied.category !== "all",
    applied.tag,
    applied.hideSoldOut,
    applied.price.min !== undefined || applied.price.max !== undefined,
    applied.sort !== "new",
  ].filter(Boolean).length
  function clearFilters() {
    setSearch("")
    setCategory("all")
    setTag("")
    setHideSoldOut(false)
    setPriceDraft({ min: "", max: "" })
    setSort("new")
    setPriceError("")
    setApplied(filterSchema.parse(initialFilters))
    pagination.onPageChange(1)
  }
  function applyFilters() {
    if (!pendingFilters.success) {
      setPriceError(pendingFilters.error.issues[0].message)
      return
    }
    setPriceError("")
    setApplied(pendingFilters.data)
  }
  const products = useMemo(() => {
    const {
      search,
      category,
      sort,
      hideSoldOut,
      tag,
      price: priceRange,
    } = applied
    const cats = new Set([category])
    for (let i = 0; i < 3; i++)
      data?.categories.forEach((c) => {
        if (c.parent && cats.has(c.parent)) cats.add(c.id)
      })
    return (data?.products || [])
      .filter(
        (p) =>
          (!hideSoldOut || p.quantity > 0) &&
          (!tag || p.tags.includes(tag)) &&
          (priceRange.min === undefined || p.price >= priceRange.min) &&
          (priceRange.max === undefined || p.price <= priceRange.max) &&
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
  }, [data, applied])
  const pagination = useListPagination(products.length, JSON.stringify(applied))
  const visibleProducts = useMemo(
    () => products.slice(pagination.start, pagination.end),
    [products, pagination.start, pagination.end]
  )
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
            收藏割愛・二手物品
          </p>
          <h1 className="text-4xl leading-[1.2] font-semibold tracking-tight sm:text-6xl">
            這次割愛，
            <br />
            喜歡就帶回家<span className="text-muted-foreground">。</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
            有收藏割愛，也有一些閒置物品。
            <br />
            確認喜歡再下單，交付方式我們私訊聊。
          </p>
          <Button className="mt-8" render={<a href="#collection" />}>
            往下逛逛 <ArrowDown className="size-4" />
          </Button>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-10 -bottom-16 hidden size-96 items-center justify-center rounded-full border-[56px] border-background/50 lg:flex"
        >
          <ArrowUpRight className="size-36 stroke-[.7] text-foreground/20" />
        </div>
        <span className="absolute right-8 bottom-6 text-[10px] tracking-[.2em] text-muted-foreground">
          SECONDHAND ITEMS
        </span>
      </section>
      <section id="collection" className="scroll-mt-28">
        <div className="mb-7 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest text-muted-foreground">
              所有商品
            </p>
            <h2 className="mt-2 text-2xl font-semibold">商品列表</h2>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {products.length} 件物品
          </span>
        </div>
        <Collapsible
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          className="mb-8"
          role="region"
          aria-label="商品篩選"
        >
          <div className="flex flex-wrap items-center gap-3">
            <CollapsibleTrigger render={<Button variant="outline" />}>
              <SlidersHorizontal />
              篩選條件
              {appliedCount > 0 && (
                <Badge variant="secondary">{appliedCount}</Badge>
              )}
              <ChevronDown className={filtersOpen ? "rotate-180" : ""} />
            </CollapsibleTrigger>
            {hasPendingChanges && (
              <span className="text-sm text-muted-foreground">
                條件已修改，尚未套用
              </span>
            )}
          </div>
          <CollapsibleContent>
            <form
              className="space-y-5 pt-5"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                applyFilters()
              }}
            >
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                <Field>
                  <FieldLabel htmlFor="catalog-search">搜尋商品</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="catalog-search"
                      aria-label="搜尋物品"
                      placeholder="搜尋物品名稱、標籤…"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <InputGroupAddon>
                      <Search />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="catalog-sort">排序</FieldLabel>
                  <AppSelect
                    id="catalog-sort"
                    label="排序方式"
                    className="w-full min-w-0"
                    value={sort}
                    onValueChange={setSort}
                    options={[
                      { value: "new", label: "最新上架" },
                      { value: "low", label: "價格：低到高" },
                      { value: "high", label: "價格：高到低" },
                    ]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
                <Field className="min-w-0">
                  <FieldLabel htmlFor="catalog-category">分類</FieldLabel>
                  <AppSelect
                    id="catalog-category"
                    label="商品分類"
                    className="w-full min-w-0"
                    value={category}
                    onValueChange={setCategory}
                    options={[
                      {
                        value: "all",
                        label: "所有分類",
                        icon: SlidersHorizontal,
                      },
                      ...(data?.categories || []).map((c) => ({
                        value: c.id,
                        label: categoryLabel(c.id, data?.categories || []),
                      })),
                    ]}
                  />
                </Field>
                <Field className="min-w-0">
                  <FieldLabel htmlFor="catalog-tag">標籤</FieldLabel>
                  <AppSelect
                    id="catalog-tag"
                    label="商品標籤"
                    className="w-full min-w-0"
                    value={tag}
                    onValueChange={setTag}
                    disabled={!tags.length}
                    options={[
                      { value: "", label: "所有標籤" },
                      ...tags.map((value) => ({ value, label: value })),
                    ]}
                  />
                </Field>
                <div className="col-span-2 min-w-0 lg:col-span-1">
                  <Field>
                    <FieldLabel htmlFor="catalog-price-min">
                      價格範圍
                    </FieldLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {(["min", "max"] as const).map((bound) => (
                        <InputGroup key={bound}>
                          <InputGroupInput
                            id={`catalog-price-${bound}`}
                            aria-label={
                              bound === "min" ? "最低價格" : "最高價格"
                            }
                            placeholder={
                              bound === "min" ? "最低價格" : "最高價格"
                            }
                            inputMode="numeric"
                            className="min-w-0 font-mono"
                            value={priceDraft[bound]}
                            aria-invalid={!!priceError}
                            aria-describedby={
                              priceError ? "price-filter-error" : undefined
                            }
                            onChange={(event) =>
                              setPriceDraft((current) => ({
                                ...current,
                                [bound]: event.target.value,
                              }))
                            }
                          />
                          <InputGroupAddon>NT$</InputGroupAddon>
                        </InputGroup>
                      ))}
                    </div>
                    {priceError && (
                      <FieldError id="price-filter-error">
                        {priceError}
                      </FieldError>
                    )}
                  </Field>
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Field orientation="horizontal" className="w-auto">
                  <Checkbox
                    id="catalog-in-stock"
                    checked={hideSoldOut}
                    onCheckedChange={setHideSoldOut}
                  />
                  <FieldLabel htmlFor="catalog-in-stock">只看有貨</FieldLabel>
                </Field>
                <div className="grid grid-cols-2 gap-3 sm:flex">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!hasFilters && appliedCount === 0}
                    onClick={clearFilters}
                  >
                    重設條件
                  </Button>
                  <Button type="submit" disabled={!hasPendingChanges}>
                    套用篩選
                  </Button>
                </div>
              </div>
            </form>
          </CollapsibleContent>
        </Collapsible>
        {products.length ? (
          <ProductGrid products={visibleProducts} onSelect={setSelected} />
        ) : (
          <EmptyState
            title={data?.products.length ? "找不到符合的物品" : "架上暫時空了"}
            description={
              data?.products.length
                ? "換個關鍵字或調整篩選條件試試。"
                : "等我整理好下一批東西，再來看看吧。"
            }
          >
            {!!data?.products.length && (
              <Button variant="outline" onClick={() => setFiltersOpen(true)}>
                調整篩選
              </Button>
            )}
          </EmptyState>
        )}
        <ListPagination {...pagination} />
      </section>
      {selected && (
        <ProductDialog product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

const ProductGrid = memo(function ProductGrid({
  products,
  onSelect,
}: {
  products: Product[]
  onSelect: (product: Product) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-9 md:grid-cols-2 md:gap-x-7 lg:grid-cols-3">
      {products.map((p, i) => (
        <button
          key={p.id}
          type="button"
          className={`group min-w-0 text-left outline-offset-4 ${p.quantity <= 0 ? "opacity-50" : ""}`}
          onClick={() => onSelect(p)}
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
  )
})
