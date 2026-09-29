import { test, expect } from "@playwright/test"

for (const width of [1280, 390]) {
  test(`上傳失敗 Toast 在 Dialog 上方且可關閉（${width}px）`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route("**/api/thrift/**", async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith("/admin/images")) return route.abort("failed")
      await route.fulfill({
        json: path.endsWith("/auth/me")
          ? { user: { id: "preview", name: "Preview", role: "admin" } }
          : { products: [], categories: [], orders: [], users: [] },
      })
    })
    await page.goto("/admin/products")
    await page.getByRole("button", { name: "新增商品", exact: true }).click()
    await page.locator('input[type="file"]').setInputFiles({
      name: "preview.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64"
      ),
    })
    const notice = page
      .locator('[data-slot="toast"]')
      .filter({ hasText: "圖片上傳失敗" })
    await expect(notice).toBeVisible()
    await expect
      .poll(() =>
        notice.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return element.contains(
            document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2
            )
          )
        })
      )
      .toBe(true)
    await notice.locator('[data-slot="toast-close"]').click()
    await expect(notice).toBeHidden()
    await expect(page.getByRole("dialog")).toBeVisible()
  })
}
