import { test, expect } from "@playwright/test"

test("商品篩選可組合庫存、標籤與價格，並驗證價格與重設分頁", async ({
  page,
}, testInfo) => {
  await page.route("**/api/thrift/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/auth/me")
        ? { user: null }
        : {
            categories: [],
            products: Array.from({ length: 13 }, (_, index) => ({
              id: String(index),
              name: `測試商品 ${index}`,
              price: index * 100,
              description: "",
              tags: [index % 2 === 0 ? "收藏" : "生活"],
              images: [],
              quantity: index === 0 ? 0 : 2,
              category: null,
              active: true,
              version: 1,
              createdAt: new Date(2026, 0, index + 1).toISOString(),
            })),
          },
    })
  )
  await page.goto("/")
  const toggle = page.getByRole("button", { name: "篩選條件" })
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
  await expect(
    page.getByRole("textbox", { name: "搜尋物品" })
  ).not.toBeVisible()
  await page.getByRole("button", { name: "下一頁", exact: true }).click()
  await expect(
    page.getByRole("button").filter({
      has: page.getByRole("heading", { name: "測試商品 0", exact: true }),
    })
  ).toHaveCSS("opacity", "0.5")
  await toggle.click()
  await page.getByRole("checkbox", { name: "只看有貨" }).check()
  await page.getByRole("combobox", { name: "商品標籤" }).click()
  await page.getByRole("option", { name: "收藏", exact: true }).click()
  await page.getByRole("textbox", { name: "最低價格" }).fill("400")
  await page.getByRole("textbox", { name: "最高價格" }).fill("800")
  await expect(page.getByText("第 11–13 筆，共 13 筆")).toBeVisible()
  await expect(page.getByText("條件已修改，尚未套用")).toBeVisible()
  await toggle.click()
  await expect(
    page.getByRole("textbox", { name: "最低價格" })
  ).not.toBeVisible()
  await toggle.click()
  await expect(page.getByRole("textbox", { name: "最低價格" })).toHaveValue(
    "400"
  )
  await page.getByRole("button", { name: "套用篩選", exact: true }).click()
  await expect(page.getByText("第 1–3 筆，共 3 筆")).toBeVisible()
  await expect(page.getByText("條件已修改，尚未套用")).not.toBeVisible()
  const headings = page.locator("#collection h3")
  await expect(headings.first()).toHaveText("測試商品 8")
  await page.getByRole("combobox", { name: "排序方式" }).click()
  await page.getByRole("option", { name: "價格：低到高", exact: true }).click()
  await expect(headings.first()).toHaveText("測試商品 8")
  await page.getByRole("button", { name: "套用篩選", exact: true }).click()
  await expect(headings.first()).toHaveText("測試商品 4")
  await page.getByRole("textbox", { name: "最高價格" }).fill("300")
  await page.getByRole("button", { name: "套用篩選", exact: true }).click()
  await expect(page.getByText("最高價格不能低於最低價格")).toBeVisible()
  await expect(page.getByText("3 件物品")).toBeVisible()
  await page.getByRole("textbox", { name: "最低價格" }).fill("1.5")
  await page.getByRole("button", { name: "套用篩選", exact: true }).click()
  await expect(page.getByText("請輸入 0 以上的新臺幣整數")).toBeVisible()
  await page.getByRole("button", { name: "重設條件", exact: true }).click()
  await expect(page.getByText("第 1–10 筆，共 13 筆")).toBeVisible()
  await expect(page.getByText("條件已修改，尚未套用")).not.toBeVisible()
  await expect(page.getByText("請輸入 0 以上的新臺幣整數")).not.toBeVisible()
  await page.getByRole("textbox", { name: "搜尋物品" }).fill("不存在的商品")
  await expect(page.getByText("13 件物品")).toBeVisible()
  await page.getByRole("button", { name: "套用篩選", exact: true }).click()
  await expect(page.getByText("找不到符合的物品")).toBeVisible()
  await toggle.click()
  await page.getByRole("button", { name: "調整篩選", exact: true }).click()
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await page.getByRole("button", { name: "重設條件", exact: true }).click()
  await expect(page.getByText("第 1–10 筆，共 13 筆")).toBeVisible()
  await page.getByRole("button", { name: "下一頁", exact: true }).click()
  await page.getByRole("textbox", { name: "搜尋物品" }).fill("未套用")
  await page.getByRole("button", { name: "重設條件", exact: true }).click()
  await expect(page.getByText("第 1–10 筆，共 13 筆")).toBeVisible()
  const filters = page.getByRole("region", { name: "商品篩選" })
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
      )
      .toBe(true)
    const controls = await filters
      .locator("form")
      .locator(
        '[data-slot="input-group"], [data-slot="select-trigger"], [data-slot="button"]'
      )
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            height: rect.height,
            top: rect.top,
            right: rect.right,
            left: rect.left,
          }
        })
      )
    expect(new Set(controls.map((control) => control.height)).size).toBe(1)
    expect(
      controls.every((control) => control.left >= 0 && control.right <= width)
    ).toBe(true)
    if (width >= 1024) {
      // 分類、標籤與兩個價格欄位對齊同一列。
      expect(
        new Set(controls.slice(2, 6).map((control) => control.top)).size
      ).toBe(1)
    }
    await filters.screenshot({
      path: testInfo.outputPath(`filters-${width}.png`),
    })
  }
})
