import { Skeleton } from "@/components/ui/skeleton"
export function PageSkeleton({ list = false }: { list?: boolean }) {
  return (
    <div role="status" aria-label="載入中" className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div
        className={
          list
            ? "space-y-4"
            : "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        }
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton
              className={list ? "h-20 w-full" : "aspect-[4/3] w-full"}
            />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
