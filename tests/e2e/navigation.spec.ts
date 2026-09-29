import { test, expect } from "@playwright/test"

test("管理導覽可切換獨立頁面，手機 Sidebar 與減少動態設定正常", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.route("**/api/thrift/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    const json = path.endsWith("/auth/me")
      ? { user: { id: "test-admin", name: "測試管理員", role: "admin" } }
      : { products: [], categories: [], orders: [], users: [] }
    await route.fulfill({ json })
  })
  await page.goto("/admin")
  await expect(page).toHaveURL(/\/admin\/products$/)
  await expect(page.getByRole("heading", { name: "商品管理" })).toBeVisible()
  for (const [section, title] of [
    ["categories", "分類管理"],
    ["orders", "訂單管理"],
    ["users", "帳號管理"],
  ]) {
    await page.getByRole("button", { name: "商店管理", exact: true }).hover()
    await page.getByRole("link", { name: new RegExp(`^${title}`) }).click()
    await expect(page).toHaveURL(new RegExp(`/admin/${section}$`))
    await expect(page.getByRole("heading", { name: title })).toBeVisible()
    await expect(page.getByRole("tab")).toHaveCount(0)
  }
  await page.mouse.move(0, 200)
  const management = page.getByRole("button", { name: "商店管理", exact: true })
  await management.focus()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("link", { name: /^商品管理/ })).toBeVisible()
  await page.keyboard.press("Escape")
  for (const width of [1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
      )
      .toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "開啟導覽列" }).click()
  const mobile = page.getByRole("navigation", { name: "手機商店管理" })
  await expect(mobile).toBeVisible()
  await mobile.getByRole("link", { name: "商品管理" }).click()
  await expect(page).toHaveURL(/\/admin\/products$/)
  await expect(mobile).toBeHidden()
  await page.getByRole("button", { name: "開啟導覽列" }).click()
  await page.getByRole("button", { name: "關閉導覽列" }).click()
  await expect(mobile).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior
      )
    )
    .toBe("smooth")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect
    .poll(() =>
      page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior
      )
    )
    .toBe("auto")
  await page.screenshot({
    path: "test-results/navigation-mobile.png",
    fullPage: true,
  })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole("button", { name: "商店管理", exact: true }).hover()
  await expect(page.getByRole("link", { name: /^訂單管理/ })).toBeVisible()
  await page.screenshot({
    path: "test-results/navigation-desktop.png",
    fullPage: true,
  })
  expect(errors).toEqual([])
})
