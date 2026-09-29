"use client"

import { useState } from "react"
import { AppSelect } from "@/components/app-select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

export function useListPagination(total: number, filterKey: string) {
  const [pageSize, setPageSize] = useState(10)
  const [state, setState] = useState({ filterKey, page: 1 })
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page =
    state.filterKey === filterKey ? Math.min(state.page, pageCount) : 1
  if (state.filterKey !== filterKey || state.page !== page) {
    setState({ filterKey, page })
  }
  return {
    total,
    page,
    pageCount,
    pageSize,
    onPageSizeChange: (value: string) => {
      const size = Number(value)
      if (![10, 20, 50, 100].includes(size)) return
      setPageSize(size)
      setState({ filterKey, page: 1 })
    },
    start: (page - 1) * pageSize,
    end: Math.min(page * pageSize, total),
    onPageChange: (next: number) =>
      setState({ filterKey, page: Math.max(1, Math.min(next, pageCount)) }),
  }
}

export function ListPagination({
  total,
  page,
  pageCount,
  start,
  end,
  onPageChange,
  pageSize,
  onPageSizeChange,
  separator = true,
}: ReturnType<typeof useListPagination> & { separator?: boolean }) {
  if (!total) return null
  const pages = Array.from(new Set([1, page - 1, page, page + 1, pageCount]))
    .filter((p) => p > 0 && p <= pageCount)
    .sort((a, b) => a - b)
  const change =
    (next: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      onPageChange(next)
    }
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-4 sm:justify-between ${separator ? "mt-6 border-t pt-5" : "mt-4"}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-4">
        <p
          className="shrink-0 text-sm text-muted-foreground"
          aria-live="polite"
        >
          第 {start + 1}–{end} 筆，共 {total} 筆
        </p>
        <AppSelect
          label="每頁筆數"
          value={String(pageSize)}
          onValueChange={onPageSizeChange}
          options={[10, 20, 50, 100].map((size) => ({
            value: String(size),
            label: `每頁 ${size} 筆`,
          }))}
        />
      </div>
      <Pagination aria-label="列表分頁" className="mx-0 w-auto">
        <PaginationContent className="flex-wrap justify-center">
          <PaginationItem>
            <PaginationPrevious
              text="上一頁"
              aria-label="上一頁"
              href={page > 1 ? `?page=${page - 1}` : undefined}
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : 0}
              className={
                page === 1 ? "pointer-events-none opacity-50" : undefined
              }
              onClick={change(page - 1)}
            />
          </PaginationItem>
          {pages.map((number, index) => (
            <PaginationItem key={number} className="flex items-center">
              {index > 0 && number - pages[index - 1] > 1 && (
                <PaginationEllipsis />
              )}
              <PaginationLink
                href={`?page=${number}`}
                aria-label={`第 ${number} 頁`}
                isActive={page === number}
                onClick={change(number)}
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              text="下一頁"
              aria-label="下一頁"
              href={page < pageCount ? `?page=${page + 1}` : undefined}
              aria-disabled={page === pageCount}
              tabIndex={page === pageCount ? -1 : 0}
              className={
                page === pageCount
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
              onClick={change(page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
