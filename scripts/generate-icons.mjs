import { readFile, writeFile } from "node:fs/promises"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Recycle } from "lucide-react"
import { chromium } from "@playwright/test"

// Match Brand: a 36px circle with the same 20px Lucide Recycle icon.
const css = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8"
)
const primary = css.match(/--primary: ([^;]+);/)[1]
const foreground = css.match(/--primary-foreground: ([^;]+);/)[1]
const mark = renderToStaticMarkup(
  createElement(Recycle, { x: 8, y: 8, width: 20, height: 20 })
)
const svg = (maskable = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none" style="color:${foreground}">${maskable ? `<rect width="36" height="36" fill="${primary}"/>` : `<circle cx="18" cy="18" r="18" fill="${primary}"/>`}${mark}</svg>`
await writeFile(new URL("../app/icon.svg", import.meta.url), svg())
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  async function png(size, maskable = false) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}body>svg{display:block;width:100vw;height:100vh}</style>${svg(maskable)}`
    )
    return page.screenshot({ omitBackground: true })
  }
  for (const size of [192, 512]) {
    await writeFile(
      new URL(`../public/icons/icon-${size}.png`, import.meta.url),
      await png(size, size === 512)
    )
  }
  await writeFile(
    new URL("../public/icons/apple-touch-icon.png", import.meta.url),
    await png(180)
  )
  const sizes = [16, 32, 48]
  const images = []
  for (const size of sizes) images.push(await png(size))
  const header = Buffer.alloc(6 + sizes.length * 16)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  let offset = header.length
  images.forEach((data, i) => {
    const at = 6 + i * 16
    header[at] = sizes[i]
    header[at + 1] = sizes[i]
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(data.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += data.length
  })
  await writeFile(
    new URL("../app/favicon.ico", import.meta.url),
    Buffer.concat([header, ...images])
  )
} finally {
  await browser.close()
}
