import type { Catalog as CatalogData } from "@/lib/types"
export function categoryLabel(
  id: string,
  categories: CatalogData["categories"]
): string {
  const c = categories.find((c) => c.id === id)
  return c
    ? `${c.parent ? `${categoryLabel(c.parent, categories)} / ` : ""}${c.name}`
    : "未分類"
}
