import { test, expect } from "@playwright/test"

test("Data Table 依數值排序全部資料，保留分頁並支援快速上下架", async ({
  page,
}) => {
  const products = Array.from({ length: 12 }, (_, i) => ({
    id: `product-${i}`,
    name: `商品 ${i + 1}`,
    price: [1000, 20, 3, 400, 50, 6, 700, 80, 9, 100, 11, 2][i],
    quantity: i + 1,
    active: i !== 0,
    version: 1,
    images: [],
    description: "商品說明",
    tags: ["收藏"],
    category: null,
  }))
  let fail = false
  let mutations = 0
  await page.route("**/api/thrift/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    if (route.request().method() === "PUT") {
      mutations++
      const body = route.request().postDataJSON()
      const product = products.find((p) => path.endsWith(p.id))!
      expect(body.quantity).toBe(product.quantity)
      expect(body.price).toBe(product.price)
      expect(body.version).toBe(product.version)
      if (fail)
        return route.fulfill({
          status: 409,
          json: { message: "商品已更新，請重新操作" },
        })
      Object.assign(product, body, { version: product.version + 1 })
      return route.fulfill({ json: { record: product } })
    }
    await route.fulfill({
      json: path.endsWith("/auth/me")
        ? { user: { id: "admin", name: "管理員", role: "admin" } }
        : { products, categories: [], orders: [], users: [] },
    })
  })
  await page.goto("/admin/products")
  const rows = page.locator("tbody tr")
  await expect(rows).toHaveCount(10)
  await expect(rows.first()).toContainText("1,000")
  await expect(page.getByRole("table")).not.toContainText("NT$")
  const activeColor = await rows
    .nth(1)
    .locator('[data-slot="badge"]')
    .evaluate((e) => getComputedStyle(e).backgroundColor)
  expect(
    await rows
      .first()
      .locator('[data-slot="badge"]')
      .evaluate((e) => getComputedStyle(e).backgroundColor)
  ).not.toBe(activeColor)
  await page.getByRole("button", { name: "下一頁", exact: true }).click()
  await page.getByRole("button", { name: "金額", exact: true }).click()
  await expect(
    page.getByRole("columnheader", { name: "金額" })
  ).toHaveAttribute("aria-sort", "ascending")
  await expect(rows).toHaveCount(10)
  await expect(rows.first()).toContainText("商品 12")
  await expect(rows.nth(1)).toContainText("商品 3")
  await page.getByRole("button", { name: "金額", exact: true }).click()
  await expect(
    page.getByRole("columnheader", { name: "金額" })
  ).toHaveAttribute("aria-sort", "descending")
  await expect(rows.first()).toContainText("商品 1")
  await page.getByRole("button", { name: "上架 商品 1", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "下架 商品 1", exact: true })
  ).toBeVisible()
  await expect(rows.first().locator('[data-slot="badge"]')).toHaveText("上架")
  await page.getByRole("button", { name: "下架 商品 1", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "上架 商品 1", exact: true })
  ).toBeVisible()
  expect(mutations).toBe(2)
  fail = true
  await page.getByRole("button", { name: "上架 商品 1", exact: true }).click()
  await expect(
    page.getByText("商品已更新，請重新操作", { exact: true })
  ).toBeVisible()
  await expect(rows.first().locator('[data-slot="badge"]')).toHaveText("下架")
  await expect(page.getByRole("dialog", { name: "編輯商品" })).toHaveCount(0)
})

test("分類、訂單與帳號表格均可排序", async ({ page }) => {
  const names = ["B", "A"]
  await page.route("**/api/thrift/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/auth/me")
        ? { user: { id: "admin", role: "admin", name: "管理員" } }
        : {
            products: [],
            categories: names.map((name) => ({
              id: name,
              name,
              parent: null,
              version: 1,
            })),
            users: names.map((name) => ({
              id: name,
              name,
              email: `${name}@example.com`,
              phone: "",
              role: "user",
              status: "active",
              version: 1,
            })),
            orders: names.map((name) => ({
              id: name,
              number: name,
              token: name,
              customer: { name, contact: { platform: "LINE", account: name } },
              items: [],
              total: 1234,
              status: "pending",
              createdAt: "2026-09-01T00:00:00Z",
              version: 1,
            })),
          },
    })
  )
  for (const [section, heading] of [
    ["categories", "分類名稱"],
    ["orders", "訂單編號"],
    ["users", "姓名 / 信箱"],
  ]) {
    await page.goto(`/admin/${section}`)
    await page.getByRole("button", { name: heading, exact: true }).click()
    await expect(
      page.locator("tbody tr").first().locator("td").first()
    ).toContainText("A")
    await expect(
      page.getByRole("columnheader", { name: heading })
    ).toHaveAttribute("aria-sort", "ascending")
    await expect(page.getByRole("table")).not.toContainText("NT$")
    if (section === "orders")
      await expect(page.locator("tbody tr").first()).toContainText("1,234")
  }
})
