import { test, expect } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`${width}px 切換路由與新增成功回到頁首，失敗保留表單`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 667 })
    let fail = true
    await page.route("**/api/thrift/**", (route) => {
      if (route.request().method() === "POST")
        return route.fulfill({
          status: fail ? 409 : 201,
          json: fail
            ? { message: "分類名稱重複" }
            : { record: { id: "new", name: "新分類" } },
        })
      return route.fulfill({
        json: route.request().url().endsWith("/auth/me")
          ? {
              user: {
                id: "admin",
                role: "admin",
                name: "管理員",
                email: "admin@example.test",
              },
            }
          : {
              products: [],
              orders: [],
              users: [],
              categories: Array.from({ length: 30 }, (_, i) => ({
                id: `c-${i}`,
                name: `分類 ${i}`,
                parent: null,
                version: 1,
              })),
            },
      })
    })
    await page.goto("/admin/categories")
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await page.evaluate(() =>
      window.scrollTo({ top: 500, behavior: "instant" })
    )
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100)
    await page
      .getByRole("button", { name: "新增分類", exact: true })
      .evaluate((e: HTMLButtonElement) => e.click())
    await page.getByRole("textbox", { name: /^分類名稱/ }).fill("新分類")
    await page.getByRole("button", { name: "儲存分類", exact: true }).click()
    await expect(
      page.getByRole("dialog", { name: "新增分類", exact: true })
    ).toBeVisible()
    await expect(page.getByRole("textbox", { name: /^分類名稱/ })).toHaveValue(
      "新分類"
    )
    await expect(
      page.locator('[data-slot="toast"]').filter({ hasText: "分類名稱重複" })
    ).toBeVisible()
    fail = false
    await page.getByRole("button", { name: "儲存分類", exact: true }).click()
    await expect(
      page.getByRole("dialog", { name: "新增分類", exact: true })
    ).toBeHidden()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await page.getByRole("link", { name: "查看商品", exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await page.getByRole("link", { name: "往下逛逛" }).click()
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100)
    await page.goBack()
    // The first back removes the anchor; the next returns to the previous route.
    if (new URL(page.url()).pathname === "/") await page.goBack()
    await expect(page).toHaveURL(/admin\/categories$/)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })
}
