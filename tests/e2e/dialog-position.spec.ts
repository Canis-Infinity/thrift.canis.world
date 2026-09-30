import { test, expect, chromium, type Locator } from "@playwright/test"

const products = Array.from({ length: 10 }, (_, i) => ({
  id: `p${i}`,
  name: `收藏 ${i}`,
  price: 100,
  quantity: 5,
  active: true,
  version: 1,
  images: ["photo"],
  tags: ["收藏"],
  description: "商品說明",
  category: null,
  createdAt: "2026-01-01",
}))

async function centered(dialog: Locator) {
  await expect(dialog).toBeVisible()
  await expect
    .poll(() =>
      dialog.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return Math.max(
          Math.abs(r.x + r.width / 2 - innerWidth / 2),
          Math.abs(r.y + r.height / 2 - innerHeight / 2)
        )
      })
    )
    .toBeLessThan(1)
  expect(
    await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return (
        r.left >= 15 &&
        r.right <= innerWidth - 15 &&
        r.top >= 0 &&
        r.bottom <= innerHeight
      )
    })
  ).toBe(true)
}

for (const width of [1440, 1130, 800, 390, 320]) {
  test(`${width}px 所有視窗置中，購物車操作保留瀏覽位置`, async () => {
    const browser = await chromium.launch({
      ignoreDefaultArgs: ["--hide-scrollbars"],
    })
    const page = await browser.newPage({ viewport: { width, height: 790 } })
    try {
      await page.route("**/_next/image?**", (r) =>
        r.fulfill({ path: "public/icons/icon-512.png" })
      )
      await page.route("**/api/thrift/**", (r) =>
        r.fulfill({
          json: r.request().url().endsWith("/auth/me")
            ? {
                user: {
                  id: "admin",
                  name: "管理員",
                  role: "admin",
                  contact: { platform: "LINE", account: "test" },
                },
              }
            : {
                products,
                categories: [
                  { id: "c1", name: "分類", parent: null, version: 1 },
                ],
                orders: [
                  {
                    id: "o1",
                    number: "ORDER1",
                    status: "pending",
                    total: 100,
                    version: 1,
                    createdAt: "2026-01-01",
                    customer: {
                      name: "顧客",
                      contact: { platform: "LINE", account: "test" },
                    },
                    items: [
                      {
                        product: "p0",
                        name: "收藏 0",
                        quantity: 1,
                        price: 100,
                      },
                    ],
                  },
                ],
                users: [],
              },
        })
      )
      await page.goto("http://localhost:7346/")
      await page.locator("#collection h3").first().click()
      const detail = page.getByRole("dialog", { name: "收藏 0", exact: true })
      await centered(detail)
      const beforeAdd = await page.evaluate(() => scrollY)
      await page.getByRole("button", { name: "放大檢視 收藏 0 的照片" }).click()
      await centered(
        page.getByRole("dialog", { name: "收藏 0・照片", exact: true })
      )
      await page.keyboard.press("Escape")
      await detail
        .getByRole("button", { name: "加入購物車", exact: true })
        .click()
      await expect(detail).toBeHidden()
      await page.waitForTimeout(350)
      expect(await page.evaluate(() => scrollY)).toBe(beforeAdd)

      for (const [path, label, edit, del] of [
        ["products", "商品", "編輯 收藏 0", "刪除 收藏 0"],
        ["categories", "分類", "編輯分類 分類", "刪除分類 分類"],
        ["orders", "訂單", "編輯訂單 ORDER1", "刪除訂單 ORDER1"],
      ]) {
        await page.goto(`http://localhost:7346/admin/${path}`)
        for (const [button, title] of [
          [`新增${label}`, `新增${label}`],
          [edit, `編輯${label}`],
        ]) {
          await page.getByRole("button", { name: button, exact: true }).click()
          await centered(page.getByRole("dialog", { name: title, exact: true }))
          await page.keyboard.press("Escape")
        }
        await page.getByRole("button", { name: del, exact: true }).click()
        await centered(page.getByRole("alertdialog"))
        await page.getByRole("button", { name: "取消", exact: true }).click()
      }
      await page.evaluate(
        (items) =>
          localStorage.setItem(
            "thrift-cart",
            JSON.stringify(items.map((p) => ({ product: p.id, quantity: 1 })))
          ),
        products
      )
      await page.goto("http://localhost:7346/cart")
      await page
        .getByRole("button", { name: "移除 收藏 4", exact: true })
        .click()
      await centered(page.getByRole("alertdialog"))
      const beforeRemove = await page.evaluate(() => scrollY)
      await page.getByRole("button", { name: "確認刪除", exact: true }).click()
      await expect(
        page.getByRole("button", { name: "移除 收藏 4", exact: true })
      ).toHaveCount(0)
      await page.waitForTimeout(350)
      expect(await page.evaluate(() => scrollY)).toBe(beforeRemove)
    } finally {
      await browser.close()
    }
  })
}
