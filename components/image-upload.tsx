"use client"
import { useState } from "react"
import { ImagePlus, Trash2, ArrowLeft, ArrowRight } from "lucide-react"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemProgress,
} from "@/components/ui/file-upload"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { ConfirmDelete } from "@/components/confirm-delete"
import { ProductImage } from "@/components/product-image"
import { uploadImage } from "@/lib/api"
import { mutation } from "@/lib/notifications"
export function ImageUpload({
  images,
  onChange,
  onBusy,
  disabled,
}: {
  images: string[]
  onChange: (images: string[]) => void
  onBusy: (busy: boolean) => void
  disabled: boolean
}) {
  const [files, setFiles] = useState<File[]>([]),
    [remove, setRemove] = useState<string | null>(null)
  function move(index: number, offset: number) {
    const next = [...images]
    ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
    onChange(next)
  }
  return (
    <div className="space-y-4">
      <FileUpload
        value={files}
        onValueChange={setFiles}
        required={!images.length}
        label="商品照片"
        name="images"
        accept="image/jpeg,image/png,image/webp"
        maxSize={12 * 1024 * 1024}
        maxFiles={10 - images.length}
        multiple
        disabled={disabled || images.length >= 10}
        onFileReject={(_, message) =>
          toast.add({ title: message, type: "error" })
        }
        onUpload={async (batch, { onProgress, onSuccess, onError }) => {
          onBusy(true)
          const next = [...images]
          try {
            await mutation("圖片上傳中…", "照片上傳完成", async () => {
              for (const file of batch) {
                try {
                  const result = await uploadImage(file, (progress) =>
                    onProgress(file, progress)
                  )
                  next.push(result.id)
                  onProgress(file, 100)
                  onSuccess(file)
                } catch (e) {
                  onError(file, e instanceof Error ? e : new Error("上傳失敗"))
                  throw e
                }
              }
            })
          } catch {
          } finally {
            onChange(next)
            setFiles([])
            onBusy(false)
          }
        }}
      >
        <FileUploadDropzone className="p-6">
          <ImagePlus className="size-7 text-muted-foreground" />
          <p className="text-sm">拖放照片，或選擇檔案</p>
          <p className="text-xs text-muted-foreground">
            JPEG、PNG、WebP · 每張最多 12MB · 最多 10 張
          </p>
          <FileUploadTrigger render={<Button variant="outline" size="sm" />}>
            選擇照片
          </FileUploadTrigger>
        </FileUploadDropzone>
        <FileUploadList>
          {files.map((file, i) => (
            <FileUploadItem key={`${file.name}-${i}`} value={file}>
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemProgress />
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((id, i) => (
          <div key={id}>
            <ProductImage id={id} name={`商品照片 ${i + 1}`} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {i === 0 ? "封面照片" : `照片 ${i + 1}`}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled || i === 0}
                aria-label={`照片 ${i + 1} 往前移`}
                onClick={() => move(i, -1)}
              >
                <ArrowLeft />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled || i === images.length - 1}
                aria-label={`照片 ${i + 1} 往後移`}
                onClick={() => move(i, 1)}
              >
                <ArrowRight />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={`刪除照片 ${i + 1}`}
                onClick={() => setRemove(id)}
              >
                <Trash2 />
              </Button>
            </div>
            {i > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() =>
                  onChange([id, ...images.filter((v) => v !== id)])
                }
              >
                設為封面
              </Button>
            )}
          </div>
        ))}
      </div>
      {remove && (
        <ConfirmDelete
          title="移除此商品照片？"
          description="儲存商品後，這張照片將不再顯示於商品頁。"
          onConfirm={() => onChange(images.filter((id) => id !== remove))}
          onClose={() => setRemove(null)}
        />
      )}
    </div>
  )
}
