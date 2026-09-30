import { test, expect } from "@playwright/test"

const products = Array.from({ length: 4000 }, (_, i) => ({
  id: `product-${i}`,
  name: `大量商品 ${i}`,
  price: i + 1,
  quantity: 5,
  active: true,
  version: 1,
  images: [],
  description: "商品說明 ".repeat(40),
  tags: ["收藏"],
  category: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}))

for (const width of [1440, 390]) {
  test(`${width}px 大量商品仍可編輯、排序及分頁`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const requests: string[] = []
    await page.route("**/api/thrift/**", (route) => {
      requests.push(route.request().url())
      return route.fulfill({
        json: route.request().url().endsWith("/auth/me")
          ? { user: { id: "admin", role: "admin", name: "管理員" } }
          : { products, categories: [], orders: [], users: [] },
      })
    })
    await page.goto("/admin/products")
    await expect(page.locator("tbody tr")).toHaveCount(10)
    expect(
      requests.some((url) => url.includes("admin/data?section=products"))
    ).toBe(true)
    await page.getByRole("button", { name: "金額", exact: true }).click()
    await page.getByRole("button", { name: "金額", exact: true }).click()
    await expect(page.locator("tbody tr").first()).toContainText(
      "大量商品 3999"
    )
    await page
      .getByRole("button", { name: "編輯 大量商品 3999", exact: true })
      .click()
    await expect(page.getByRole("dialog", { name: "編輯商品" })).toBeVisible()
    await expect(page.getByLabel(/^商品名稱/)).toHaveValue("大量商品 3999")
    await page.getByRole("button", { name: "取消", exact: true }).click()
    await page.getByRole("button", { name: "下一頁", exact: true }).click()
    await expect(page.locator("tbody tr").first()).toContainText(
      "大量商品 3989"
    )
    // Opening/closing an editor does not refetch thousands of records.
    expect(requests.filter((url) => url.includes("admin/data"))).toHaveLength(1)
  })

  test(`${width}px 首頁只呈現當頁商品，篩選草稿及視窗不重載列表`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    let loads = 0
    await page.route("**/api/thrift/**", (route) => {
      if (route.request().url().endsWith("/catalog")) loads++
      return route.fulfill({
        json: route.request().url().endsWith("/auth/me")
          ? { user: null }
          : { products, categories: [] },
      })
    })
    await page.goto("/")
    await expect(page.locator("#collection h3")).toHaveCount(10)
    await page.getByRole("button", { name: "篩選條件" }).click()
    await page.getByRole("textbox", { name: "搜尋物品" }).fill("大量商品 3999")
    await expect(page.locator("#collection h3")).toHaveCount(10)
    await page.getByRole("button", { name: "套用篩選", exact: true }).click()
    await expect(page.locator("#collection h3")).toHaveCount(1)
    await page.locator("#collection h3").click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("dialog")).toContainText("大量商品 3999")
    expect(loads).toBe(1)
  })
}
