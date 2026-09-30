import { test, expect } from "@playwright/test"

test("離線頁保留樣式與主題，恢復連線後可以重試", async ({ page, context }) => {
  await page.goto("/login")
  await page.evaluate(async () => {
    localStorage.setItem("theme", "dark")
    await navigator.serviceWorker.ready
  })
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true)
  await context.setOffline(true)
  await page.goto("/orders")
  await expect(page.getByText("暫時連不上網站", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "breadcrumb" })
  ).toContainText("目前離線")
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0)
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.locator('[data-slot="empty"]')).toHaveCSS("display", "flex")
  await expect(
    page.getByRole("button", { name: "重新連線", exact: true })
  ).toBeVisible()
  await page.screenshot({
    path: "test-results/offline-desktop.png",
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    )
    .toBe(true)
  await page.screenshot({
    path: "test-results/offline-mobile.png",
    fullPage: true,
  })
  const cached = await page.evaluate(async () => {
    const cache = await caches.open("thrift-offline-v5")
    return (await cache.keys()).map((request) => new URL(request.url).pathname)
  })
  expect(cached.some((path) => path.endsWith(".css"))).toBe(true)
  expect(cached).toContain("/icons/icon-192.png")
  expect(cached).toContain("/icons/icon-512.png")
  expect(cached).toContain("/icons/maskable-512.png")
  expect(cached.some((path) => /\.(woff2?|ttf)$/.test(path))).toBe(true)
  expect(cached.some((path) => path.startsWith("/api/"))).toBe(false)
  await context.setOffline(false)
  await page.getByRole("button", { name: "重新連線", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: /這次割愛|我用不到/ })
  ).toBeVisible()
})
