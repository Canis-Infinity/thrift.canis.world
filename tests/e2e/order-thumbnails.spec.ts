import { test, expect } from "@playwright/test"

for (const width of [1440, 320]) {
  test(`${width}px 新增選項有縮圖且編輯只允許狀態與備註`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 })
    const products = ["one", "two"].map((id) => ({
      id,
      name: "同名收藏",
      images: [`photo-${id}`],
      price: 300,
      quantity: 3,
      active: true,
      tags: [],
      version: 1,
    }))
    const order = {
      id: "o",
      number: "TEST",
      status: "pending",
      total: 300,
      version: 1,
      createdAt: "2026-10-01",
      note: "",
      customer: {
        name: "顧客",
        contact: { platform: "LINE", account: "test" },
      },
      items: [
        {
          product: "one",
          name: "同名收藏",
          image: "photo-one",
          price: 300,
          quantity: 1,
        },
      ],
    }
    await page.route("**/_next/image?**", (r) =>
      r.fulfill({ path: "public/icons/icon-512.png" })
    )
    await page.route("**/api/thrift/**", (r) =>
      r.fulfill({
        json: r.request().url().endsWith("/auth/me")
          ? { user: { id: "admin", role: "admin", name: "管理員" } }
          : { products, order, orders: [order], categories: [], users: [] },
      })
    )
    await page.goto("/admin/orders")
    await page
      .getByRole("button", { name: "編輯訂單 TEST", exact: true })
      .click()
    const dialog = page.getByRole("dialog", { name: "編輯訂單", exact: true })
    await expect(dialog.getByRole("img")).toHaveAttribute("src", /photo-one/)
    await expect(dialog.getByRole("combobox")).toHaveCount(1)
    await expect(dialog.getByRole("textbox")).toHaveCount(1)
    await expect(dialog.getByRole("spinbutton")).toHaveCount(0)
    await expect(
      dialog.getByRole("button", { name: "新增商品項目" })
    ).toHaveCount(0)
    await expect(dialog.getByRole("list", { name: "訂單商品" })).toContainText(
      "同名收藏"
    )
    await page.screenshot({
      path: test.info().outputPath(`editor-${width}.png`),
    })
    await dialog.getByRole("button", { name: "取消", exact: true }).click()
    await page.getByRole("button", { name: "新增訂單", exact: true }).click()
    await page.getByRole("combobox", { name: /^商品 1/ }).click()
    const options = page.getByRole("option").filter({ hasText: "同名收藏" })
    await expect(options).toHaveCount(2)
    await expect(options.nth(0).getByRole("img")).toHaveAttribute(
      "src",
      /photo-one/
    )
    await expect(options.nth(1).getByRole("img")).toHaveAttribute(
      "src",
      /photo-two/
    )
    await options.nth(1).click()
    await page.goto("/order/" + "a".repeat(64))
    const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" })
    await expect(breadcrumb.getByRole("link")).toHaveText([
      "二手物品",
      "商店管理",
      "訂單管理",
      "訂單詳情",
    ])
    await expect(breadcrumb).toContainText("訂單詳情")
  })
}

for (const width of [1440, 390, 320]) {
  test(`${width}px 訂單以不同縮圖辨識同名商品`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 })
    const order = {
      id: "order",
      number: "T20261001-TEST",
      status: "pending",
      total: 800,
      createdAt: "2026-10-01",
      note: "",
      items: [
        {
          product: "one",
          name: "同名收藏商品",
          image: "photo-one",
          price: 500,
          quantity: 1,
        },
        {
          product: "two",
          name: "同名收藏商品",
          image: "photo-two",
          price: 300,
          quantity: 1,
        },
        { product: "old", name: "舊商品", image: null, price: 0, quantity: 1 },
      ],
    }
    await page.route("**/_next/image?**", (r) =>
      r.fulfill({ path: "public/icons/icon-512.png" })
    )
    await page.route("**/api/thrift/**", (r) =>
      r.fulfill({
        json: r.request().url().endsWith("/auth/me")
          ? { user: { id: "member", name: "會員", role: "user" } }
          : { order, orders: [order] },
      })
    )
    for (const path of ["/order/" + "a".repeat(64), "/orders"]) {
      await page.goto(path)
      const items = page
        .getByRole("list", { name: "訂單商品" })
        .getByRole("listitem")
      await expect(items).toHaveCount(3)
      for (const [index, id] of ["photo-one", "photo-two"].entries()) {
        const image = items
          .nth(index)
          .getByRole("img", { name: "同名收藏商品" })
        await expect(image).toBeVisible()
        await expect(image).toHaveAttribute("src", new RegExp(id))
        expect(
          await image.evaluate(
            (e: HTMLImageElement) => e.complete && e.naturalWidth > 0
          )
        ).toBe(true)
      }
      await expect(items.nth(2)).toContainText("尚無商品圖片")
      await expect(items.first()).toContainText("NT$ 500")
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      if (path.startsWith("/order/"))
        await page.screenshot({
          path: test.info().outputPath(`order-${width}.png`),
          fullPage: true,
        })
    }
  })
}
