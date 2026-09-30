"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Minus, Plus, RotateCcw } from "lucide-react"
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  useTransformComponent,
} from "react-zoom-pan-pinch"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { toast } from "@/components/ui/toast"

export default function ZoomableProductPhoto({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [detail, setDetail] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const requestedDetail = useRef(false)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <TransformWrapper
        minScale={1}
        maxScale={4}
        disabled={!loaded || failed}
        doubleClick={{
          mode: zoomed ? "reset" : "zoomIn",
          step: 0.5,
          animationTime: 200,
        }}
        pinch={{ allowPanning: true }}
        smooth={false}
        wheel={{ step: 0.1 }}
        keyboard={{ disabled: false }}
        velocityAnimation={{ disabled: true }}
        onTransform={(_, state) => {
          setZoomed(state.scale > 1)
          // Upgrade the source only once, rather than requesting an image on each gesture frame.
          if (state.scale > 1.1 && !requestedDetail.current) {
            requestedDetail.current = true
            setDetail(true)
          }
        }}
      >
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-muted">
          {!loaded && !failed && (
            <Skeleton
              aria-label="照片載入中"
              className="absolute inset-0 size-full"
            />
          )}
          {failed ? (
            <div className="flex size-full items-center justify-center">
              <EmptyState title="照片暫時無法載入">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFailed(false)
                    setLoaded(false)
                    setRetry((v) => v + 1)
                  }}
                >
                  重試
                </Button>
              </EmptyState>
            </div>
          ) : (
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
                touchAction: "none",
              }}
              contentStyle={{ width: "100%", height: "100%" }}
              wrapperClass="cursor-grab active:cursor-grabbing"
              wrapperProps={{
                tabIndex: 0,
                role: "region",
                "aria-label": "放大照片檢視區",
                onKeyDown: (event) => {
                  if (event.key.startsWith("Arrow")) event.stopPropagation()
                },
              }}
            >
              <Image
                key={retry}
                src={`/api/thrift/images/${id}`}
                alt={name}
                fill
                sizes={
                  detail
                    ? "(max-width:767px) 300vw, 2304px"
                    : "(max-width:1152px) 100vw, 1152px"
                }
                loading="eager"
                className="pointer-events-none object-contain select-none"
                draggable={false}
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setFailed(true)
                  toast.add({
                    title: "照片暫時無法載入，請重試",
                    type: "error",
                  })
                }}
              />
            </TransformComponent>
          )}
        </div>
        <ZoomControls disabled={!loaded || failed} />
      </TransformWrapper>
    </div>
  )
}

function ZoomControls({ disabled }: { disabled: boolean }) {
  const { zoomIn, zoomOut, resetTransform } = useControls()
  const percent = useTransformComponent(({ state }) =>
    Math.round(state.scale * 100)
  )
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="group"
      aria-label="照片縮放控制"
    >
      <Button
        variant="outline"
        size="icon"
        aria-label="縮小照片"
        disabled={disabled || percent <= 100}
        onClick={() => zoomOut(0.1, 0)}
      >
        <Minus />
      </Button>
      <span
        className="w-14 text-center text-sm tabular-nums"
        aria-label="縮放倍率"
      >
        {percent}%
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label="放大照片"
        disabled={disabled || percent >= 400}
        onClick={() => zoomIn(0.1, 0)}
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        aria-label="還原照片"
        disabled={disabled || percent === 100}
        onClick={() => resetTransform()}
      >
        <RotateCcw />
        還原
      </Button>
    </div>
  )
}
