import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ContactSeller() {
  return (
    <Button
      variant="outline"
      render={
        <a
          href="https://link.canis.world"
          target="_blank"
          rel="noopener noreferrer"
        />
      }
    >
      聯絡 Canis <ArrowUpRight />
    </Button>
  )
}
