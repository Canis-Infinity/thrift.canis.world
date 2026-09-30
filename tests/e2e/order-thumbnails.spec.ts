import { test, expect } from "@playwright/test"

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
