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
  title: "THRIFT｜二手好物",
  description: "讓喜歡的物品，繼續被喜歡。探索二手好物，找到剛剛好的下一件。",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "THRIFT" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-Hant"
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
