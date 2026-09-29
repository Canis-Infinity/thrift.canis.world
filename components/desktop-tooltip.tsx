"use client"

import type { ReactElement } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function DesktopTooltip({
  label,
  children,
}: {
  label: string
  children: ReactElement
}) {
  const isMobile = useIsMobile()
  return (
    <Tooltip disabled={isMobile}>
      <TooltipTrigger render={children} delay={0} />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
