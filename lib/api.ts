export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string[]> = {}
  ) {
    super(message)
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const multipart = options.body instanceof FormData
  const response = await fetch(`/api/thrift${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      ...(!multipart ? { "Content-Type": "application/json" } : {}),
      "X-Thrift-Request": "1",
      ...options.headers,
    },
  })
  const data = await response.json()
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("thrift-session-expired"))
    throw new ApiError(data.message || "操作失敗", response.status, data.fields)
  }
  return data
}
export const send = <T>(path: string, method: string, body: unknown) =>
  api<T>(path, { method, body: JSON.stringify(body) })

export function uploadImage(
  file: File,
  onProgress: (progress: number) => void
): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/thrift/admin/images")
    xhr.setRequestHeader("X-Thrift-Request", "1")
    xhr.timeout = 60000
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 95))
    }
    xhr.onerror = () => reject(new Error("圖片上傳失敗，請檢查連線"))
    xhr.ontimeout = () => reject(new Error("圖片上傳逾時，請重試"))
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve(data)
        else reject(new ApiError(data.message || "圖片上傳失敗", xhr.status))
      } catch {
        reject(new Error("圖片服務回應異常"))
      }
    }
    const form = new FormData()
    form.append("file", file)
    xhr.send(form)
  })
}
