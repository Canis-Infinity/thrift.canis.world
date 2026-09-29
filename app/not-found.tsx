import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
export default function NotFound() {
  return (
    <EmptyState title="找不到這個頁面">
      <Button render={<Link href="/" />}>回到物品列表</Button>
    </EmptyState>
  )
}
