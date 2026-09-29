import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import "./globals.css"
import { Providers } from "@/components/providers"
import { SiteShell } from "@/components/site-shell"

import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const fontChinese = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto-sans-tc",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "THRIFT｜二手物品",
  description:
    "查看二手商品的照片、狀況和價格。支援訪客下單，付款與交付方式私訊確認。",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "THRIFT" },
  icons: {
    icon: { url: "/icon.svg?v=logo-1", type: "image/svg+xml" },
    apple: "/icons/apple-touch-icon.png?v=logo-1",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-Hant"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        fontChinese.variable
      )}
    >
      <body>
        <Providers>
          <NextTopLoader color="var(--primary)" showSpinner={false} />
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}
