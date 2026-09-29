import { OrderLinkPage } from "@/components/order-link-page"
export const metadata = {
  title: "訂單詳情｜THRIFT",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <OrderLinkPage token={token} />
}
