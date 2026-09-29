import { test, expect } from "@playwright/test"

test("API 代理保留購物車商品查詢參數", async ({ request }) => {
  // Use the real proxy and backend: intercepting the browser request would hide a dropped query string.
  const response = await request.get("/api/thrift/cart-products?ids=invalid")
  expect(response.status()).toBe(422)
  const empty = await request.get("/api/thrift/cart-products?ids=")
  expect(empty.status()).toBe(200)
  expect(await empty.json()).toEqual({ products: [] })
})

const product = {
  id: "sample",
  name: "測試物品",
  price: 100,
  quantity: 3,
  images: [],
  tags: ["二手"],
  description: "商品說明。\n\n".repeat(100),
  active: true,
  createdAt: "2026-09-29",
  version: 0,
}

test("選擇加入數量並以購物車累計數量檢查最新庫存", async ({ page }) => {
  let stock = 5
  await page.route("**/api/thrift/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/auth/me")
        ? { user: null }
        : {
            products: [
              { ...product, description: "商品說明", quantity: stock },
            ],
            categories: [],
          },
    })
  )
  await page.goto("/")
  await page.getByRole("button", { name: /測試物品/ }).click()
  const dialog = page.getByRole("dialog", { name: product.name })
  const input = dialog.getByLabel(/^數量/)
  await expect(input).toHaveValue("1")
  await dialog.getByRole("button", { name: "增加加入數量" }).click()
  await expect(input).toHaveValue("2")
  await dialog.getByRole("button", { name: "加入購物車", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("thrift-cart") || "[]")[0]?.quantity
      )
    )
    .toBe(2)
  stock = 3
  await dialog.getByRole("button", { name: "加入購物車", exact: true }).click()
  await expect(dialog.getByText(/這次最多可加入 1 件/)).toBeVisible()
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("thrift-cart") || "[]")[0].quantity
    )
  ).toBe(2)
  await input.fill("0")
  await dialog.getByRole("button", { name: "加入購物車", exact: true }).click()
  await expect(dialog.getByText("數量至少 1 件")).toBeVisible()
  await input.fill("1")
  await dialog.getByRole("button", { name: "加入購物車", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("thrift-cart") || "[]")[0]?.quantity
      )
    )
    .toBe(3)
})

test("回到購物車更新已刪除註記，保留商品資料並禁止結帳", async ({ page }) => {
  let deleted = false
  await page.addInitScript(() =>
    localStorage.setItem(
      "thrift-cart",
      JSON.stringify([{ product: "sample", quantity: 1 }])
    )
  )
  await page.route("**/api/thrift/**", (route) => {
    if (route.request().url().includes("/images/"))
      return route.fulfill({ path: "public/icons/icon-192.png" })
    return route.fulfill({
      json: route.request().url().endsWith("/auth/me")
        ? { user: null }
        : {
            products: [
              { ...product, images: ["photo"], active: !deleted, deleted },
            ],
          },
    })
  })
  await page.goto("/cart")
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "確認並建立訂單" })
  ).toBeEnabled()
  deleted = true
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "已刪除" })
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible()
  await expect(page.getByRole("img", { name: product.name })).toBeVisible()
  await expect(page.getByText("NT$ 100", { exact: true }).first()).toBeVisible()
  await expect(
    page.getByRole("button", { name: "確認並建立訂單" })
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: `增加 ${product.name} 數量` })
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: `移除 ${product.name}` })
  ).toBeEnabled()
})

test("結帳失敗保留商品資料，同時標示下架與庫存不足", async ({ page }) => {
  let unavailable = false
  await page.addInitScript(() =>
    localStorage.setItem(
      "thrift-cart",
      JSON.stringify([{ product: "sample", quantity: 2 }])
    )
  )
  await page.route("**/api/thrift/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith("/auth/me"))
      return route.fulfill({ json: { user: null } })
    if (path.endsWith("/checkout")) {
      unavailable = true
      return route.fulfill({ status: 409, json: { message: "商品狀態已變更" } })
    }
    if (path.includes("/images/"))
      return route.fulfill({ path: "public/icons/icon-192.png" })
    await route.fulfill({
      json: {
        products: [
          {
            ...product,
            images: ["photo"],
            active: !unavailable,
            quantity: unavailable ? 0 : 3,
          },
        ],
      },
    })
  })
  await page.goto("/cart")
  await page.getByLabel(/^姓名/).fill("顧客")
  await page.getByLabel("聯繫帳號或個人頁面連結").fill("buyer")
  await page.getByRole("button", { name: "確認並建立訂單" }).click()
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible()
  await expect(page.getByRole("img", { name: product.name })).toBeVisible()
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "已下架" })
  ).toBeVisible()
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: "庫存不足" })
  ).toBeVisible()
  await expect(page.getByText("目前剩餘 0 件，請調整數量")).toBeVisible()
  await expect(page.getByText("NT$ 100", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "確認並建立訂單" })
  ).toBeDisabled()
  await expect(page.getByLabel(/^姓名/)).toHaveValue("顧客")
  await expect(
    page.getByRole("button", { name: `增加 ${product.name} 數量` })
  ).toBeDisabled()
})

test("加入購物車重新確認庫存，結帳失敗更新剩餘數量", async ({ page }) => {
  let quantity = 3
  await page.route("**/api/thrift/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith("/auth/me"))
      return route.fulfill({ status: 401, json: { message: "請登入" } })
    if (path.endsWith("/checkout")) {
      quantity = 0
      return route.fulfill({
        status: 409,
        json: { message: "測試物品 庫存不足" },
      })
    }
    await route.fulfill({
      json: { products: [{ ...product, quantity }], categories: [] },
    })
  })
  await page.goto("/")
  await page.getByRole("button", { name: /測試物品/ }).click()
  quantity = 0
  await page.getByRole("button", { name: "加入購物車", exact: true }).click()
  await expect(page.locator('[data-slot="toast"]')).toContainText(
    "目前剩餘 0 件"
  )
  expect(
    await page.evaluate(() => localStorage.getItem("thrift-cart"))
  ).toBeNull()
  await page.getByRole("button", { name: "關閉", exact: true }).click()
  quantity = 1
  await page.reload()
  await page.getByRole("button", { name: /測試物品/ }).click()
  await page.getByRole("button", { name: "加入購物車", exact: true }).click()
  await expect(page.locator('[data-slot="toast"]')).toContainText(
    "已加入購物車"
  )
  await page.getByRole("button", { name: "加入購物車", exact: true }).click()
  await expect(
    page.locator('[data-slot="toast"]').filter({ hasText: "購物車已有 1 件" })
  ).toBeVisible()
  await page.goto("/cart")
  await page.getByLabel(/^姓名/).fill("顧客")
  await page.getByLabel("聯繫帳號或個人頁面連結").fill("buyer")
  await page.getByRole("button", { name: "確認並建立訂單" }).click()
  await expect(page.getByText("目前剩餘 0 件，請調整數量")).toBeVisible()
  await expect(page.getByLabel(/^姓名/)).toHaveValue("顧客")
  await expect(
    page.getByRole("button", { name: "確認並建立訂單" })
  ).toBeDisabled()
})

test("管理 Dialog 的 Header 與 Footer 在捲動後仍可見且提交表單", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 })
  await page.route("**/api/thrift/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/auth/me")
        ? { user: { id: "admin", name: "管理員", role: "admin" } }
        : { products: [], categories: [], orders: [], users: [] },
    })
  )
  for (const [section, label] of [
    ["products", "商品"],
    ["categories", "分類"],
    ["orders", "訂單"],
  ]) {
    await page.goto(`/admin/${section}`)
    await page
      .getByRole("button", { name: `新增${label}`, exact: true })
      .click()
    const dialog = page.locator('[data-slot="dialog-content"]')
    const header = dialog.locator('[data-slot="dialog-header"]')
    const footer = dialog.locator('[data-slot="dialog-footer"]')
    await dialog.evaluate(async (el) => {
      await Promise.all(
        el.getAnimations().map((animation) => animation.finished)
      )
    })
    const before = await header.boundingBox()
    await dialog.locator("form").evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    expect(await header.boundingBox()).toEqual(before)
    const bounds = await footer.boundingBox()
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(700)
    await footer.getByRole("button", { name: `儲存${label}` }).click()
    await expect(
      dialog.getByText("此欄位為必填", { exact: true }).first()
    ).toBeAttached()
    await footer.getByRole("button", { name: "取消" }).click()
    await expect(dialog).toBeHidden()
  }
})

test("首頁與登入頁共用一致的導覽樣式", async ({ page }) => {
  await page.route("**/api/thrift/**", (route) =>
    route.fulfill({
      status: route.request().url().endsWith("/auth/me") ? 401 : 200,
      json: { products: [], categories: [] },
    })
  )
  await page.goto("/")
  const navigation = page.getByRole("navigation", { name: "主要導覽" })
  await expect(
    navigation.getByRole("link", { name: "登入 / 註冊" })
  ).toBeVisible()
  const baseline = await page.locator("header").evaluate((el) => ({
    className: el.className,
    height: el.getBoundingClientRect().height,
    text: el.textContent,
  }))
  await navigation.getByRole("link", { name: "登入 / 註冊" }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(
    await page.locator("header").evaluate((el) => ({
      className: el.className,
      height: el.getBoundingClientRect().height,
      text: el.textContent,
    }))
  ).toEqual(baseline)
})
