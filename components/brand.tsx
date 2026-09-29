import { Recycle } from "lucide-react"

export function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Recycle className="size-5" aria-hidden="true" />
      </span>
      <span className="text-xl font-semibold tracking-wide">THRIFT</span>
    </span>
  )
}
