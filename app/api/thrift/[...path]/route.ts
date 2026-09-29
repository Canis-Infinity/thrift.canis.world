import { NextRequest } from "next/server"
export const dynamic = "force-dynamic"
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  const noStore = { "Cache-Control": "no-store" }
  if (path.some((p) => !/^[a-zA-Z0-9-]+$/.test(p)))
    return Response.json(
      { message: "無效路徑" },
      { status: 400, headers: noStore }
    )
  const write = !["GET", "HEAD"].includes(request.method)
  if (write) {
    let valid = false
    try {
      valid =
        new URL(request.headers.get("origin") || "").host ===
        request.headers.get("host")
    } catch {}
    if (
      !valid ||
      request.headers.get("x-thrift-request") !== "1" ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return Response.json(
        { message: "請由本站提交操作" },
        { status: 403, headers: noStore }
      )
  }
  const headers = new Headers({
    "X-Thrift-Request": "1",
    "Content-Type": request.headers.get("content-type") || "application/json",
  })
  const cookie = request.cookies.get("thrift_session")?.value
  if (cookie && /^[a-f0-9]{64}$/.test(cookie))
    headers.set("Cookie", `thrift_session=${cookie}`)
  headers.set("X-Forwarded-Proto", request.nextUrl.protocol.replace(":", ""))
  try {
    const max =
      path.join("/") === "admin/images" ? 13 * 1024 * 1024 : 128 * 1024
    if (Number(request.headers.get("content-length")) > max)
      return Response.json({ message: "資料過大" }, { status: 413 })
    const body = write ? await request.arrayBuffer() : undefined
    if (body && body.byteLength > max)
      return Response.json({ message: "資料過大" }, { status: 413 })
    const response = await fetch(
      `${process.env.INTERNAL_API_BASE_URL || "http://127.0.0.1:7344"}/api/thrift/${path.join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(20000),
      }
    )
    const resultHeaders = new Headers({
      ...noStore,
      "Content-Type":
        response.headers.get("content-type") || "application/json",
      "X-Content-Type-Options": "nosniff",
    })
    for (const value of response.headers.getSetCookie())
      resultHeaders.append("Set-Cookie", value)
    return new Response(response.body, {
      status: response.status,
      headers: resultHeaders,
    })
  } catch {
    return Response.json(
      { message: "暫時無法連線至服務，請稍後重試" },
      { status: 502, headers: noStore }
    )
  }
}
export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
}
