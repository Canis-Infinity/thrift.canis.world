import type { MetadataRoute } from "next"
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "THRIFT｜二手物品",
    short_name: "THRIFT",
    description: "查看二手商品、加入購物車及查詢訂單。",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#171717",
    lang: "zh-TW",
    icons: [
      {
        src: "/icons/icon-192.png?v=logo-2",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png?v=logo-2",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png?v=logo-2",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
