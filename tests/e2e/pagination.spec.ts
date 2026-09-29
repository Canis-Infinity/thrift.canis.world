import { test, expect } from "@playwright/test"

test("列表可切換筆數、翻頁，搜尋後重設頁碼", async ({ page }) => {
  await page.route("**/api/thrift/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/auth/me")
        ? { user: { id: "preview", name: "管理員", role: "admin" } }
        : {
            products: [],
            orders: [],
            users: [],
            categories: Array.from({ length: 105 }, (_, index) => ({
              id: String(index),
              name: `分類 ${String(index + 1).padStart(3, "0")}`,
              parent: null,
              version: 1,
            })),
          },
    })
  )
  await page.goto("/admin/categories")
  await expect(page.locator("tbody tr")).toHaveCount(10)
  await page.getByRole("button", { name: "下一頁", exact: true }).click()
  await expect(page.locator("tbody tr").first()).toContainText("分類 011")
  for (const size of [20, 50, 100, 10]) {
    await page.getByRole("combobox", { name: "每頁筆數" }).click()
    await page
      .getByRole("option", { name: `每頁 ${size} 筆`, exact: true })
      .click()
    await expect(page.locator("tbody tr")).toHaveCount(size)
    await expect(page.locator("tbody tr").first()).toContainText("分類 001")
  }
  await page.getByRole("button", { name: "第 11 頁", exact: true }).click()
  await expect(page.locator("tbody tr")).toHaveCount(5)
  await expect(page.getByLabel("下一頁", { exact: true })).toHaveAttribute(
    "aria-disabled",
    "true"
  )
  await page.getByRole("textbox", { name: "搜尋管理資料" }).fill("分類 001")
  await expect(page.locator("tbody tr")).toHaveCount(1)
  await expect(page.getByText("第 1–1 筆，共 1 筆")).toBeVisible()
  await page.getByRole("textbox", { name: "搜尋管理資料" }).fill("")
  await expect(page.locator("tbody tr").first()).toContainText("分類 001")
  await page
    .getByRole("button", { name: "下一頁", exact: true })
    .click({ clickCount: 1 })
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "下一頁", exact: true }).click()
  await page.setViewportSize({ width: 320, height: 844 })
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    )
    .toBe(true)
})
