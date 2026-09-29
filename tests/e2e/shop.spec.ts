import { test, expect } from "@playwright/test"
test("admin upload, catalog, guest checkout, private link, cancellation and mobile navigation", async ({
  page,
  browser,
}) => {
  const failures: string[] = []
  const productName = `測試二手咖啡杯-${Date.now()}`
  page.on("pageerror", (e) => failures.push(e.message))
  await page.goto("/login")
  await page.getByLabel("電子信箱").fill("admin@thrift.test")
  await page.getByLabel(/^密碼/).fill("thrift-e2e-only-password")
  await page.getByRole("button", { name: "登入", exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto("/admin")
  await page.getByRole("button", { name: "新增商品", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("商品名稱").fill(productName)
  await dialog.getByLabel("金額").fill("280")
  await dialog.getByLabel("商品數量").fill("3")
  await dialog.getByLabel(/^標籤/).fill("近全新、生活用品")
  await dialog
    .getByLabel("商品說明", { exact: true })
    .fill("**近全新**，附原盒。\n\n- 容量 300ml\n- 無裂痕")
  await dialog
    .locator('input[type="file"]')
    .setInputFiles("public/icons/icon-192.png")
  await expect(dialog.getByText("封面照片", { exact: true })).toBeVisible()
  await dialog.getByRole("button", { name: "儲存商品" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText(productName, { exact: true })).toBeVisible()
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  })
  const guest = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const shop = await guest.newPage()
  shop.on("pageerror", (e) => failures.push(e.message))
  await shop.goto("/")
  await shop.getByRole("button", { name: new RegExp(productName) }).click()
  await shop.getByRole("button", { name: "加入購物車" }).click()
  await shop.getByRole("dialog").getByRole("button", { name: "Close" }).click()
  await shop.evaluate(() => window.scrollTo(0, 0))
  await shop.screenshot({
    path: "test-results/catalog-desktop.png",
    fullPage: true,
  })
  await shop.goto("/cart")
  await shop.getByLabel(/^姓名/).fill(productName)
  await shop.getByLabel("聯繫帳號或個人頁面連結").fill("guest-test")
  await shop.getByRole("button", { name: "確認並建立訂單" }).click()
  await expect(
    shop.getByRole("heading", { name: "訂單已成立", level: 1 })
  ).toBeVisible()
  await shop.getByRole("link", { name: "查看訂單" }).click()
  await expect(shop.getByRole("heading", { name: "訂單詳情" })).toBeVisible()
  const privateLink = shop.url()
  await page.reload()
  await page.getByRole("tab", { name: "訂單", exact: true }).click()
  await page.getByLabel("搜尋管理資料").fill(productName)
  await page.getByRole("button", { name: /^編輯訂單 / }).click()
  await page.getByLabel("訂單狀態").click()
  await page.getByRole("option", { name: "已取消", exact: true }).click()
  await page.getByRole("button", { name: "儲存訂單" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await shop.goto(privateLink)
  await expect(shop.getByText("已取消", { exact: true })).toBeVisible()
  await shop.setViewportSize({ width: 390, height: 844 })
  await shop.goto("/")
  await shop.getByRole("button", { name: "開啟導覽列" }).click()
  await expect(shop.getByRole("dialog")).toBeVisible()
  await shop
    .getByRole("dialog")
    .getByRole("link", { name: "登入 / 註冊" })
    .click()
  await expect(shop.getByRole("heading", { name: "歡迎回來" })).toBeVisible()
  await expect(shop.getByRole("dialog")).toHaveCount(0)
  await shop.screenshot({
    path: "test-results/login-mobile.png",
    fullPage: true,
  })
  expect(
    await shop.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  expect(failures).toEqual([])
  await guest.close()
})
test("register field errors, password visibility and public API origin guard", async ({
  page,
}) => {
  await page.goto("/register")
  await page.getByRole("button", { name: "建立帳號", exact: true }).click()
  await expect(page.getByText("此欄位為必填", { exact: true })).toBeVisible()
  await page.getByLabel(/^密碼/).fill("test-password-2026")
  await page.getByRole("button", { name: "顯示密碼", exact: true }).click()
  await expect(page.getByLabel(/^密碼/)).toHaveAttribute("type", "text")
  const response = await page.request.post("/api/thrift/checkout", { data: {} })
  expect(response.status()).toBe(403)
})

test("category editor, destructive confirmation, account name and dark mode", async ({
  page,
}) => {
  await page.goto("/login")
  await page.getByLabel("電子信箱").fill("admin@thrift.test")
  await page.getByLabel(/^密碼/).fill("thrift-e2e-only-password")
  await page.getByRole("button", { name: "登入", exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto("/admin")
  await page.getByRole("tab", { name: "分類", exact: true }).click()
  await page.getByRole("button", { name: "新增分類", exact: true }).click()
  const name = `測試分類-${Date.now()}`
  await page.getByLabel("分類名稱").fill(name)
  await page.getByRole("button", { name: "儲存分類", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page
    .getByRole("button", { name: `刪除分類 ${name}`, exact: true })
    .click()
  await expect(page.getByRole("alertdialog")).toBeVisible()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "取消", exact: true })
    .click()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page
    .getByRole("button", { name: `刪除分類 ${name}`, exact: true })
    .click()
  await page.getByRole("button", { name: "確認刪除", exact: true }).click()
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  await expect(page.getByText(name, { exact: true })).toHaveCount(0)
  await page.goto("/settings")
  await page.getByLabel("姓名").fill("管理員修改名稱")
  await page.getByRole("button", { name: "儲存姓名", exact: true }).click()
  await expect(
    page
      .getByRole("region", { name: "Notifications" })
      .getByText("已儲存", { exact: true })
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel("姓名")).toHaveValue("管理員修改名稱")
  await page.getByRole("button", { name: "切換明暗主題" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.screenshot({
    path: "test-results/settings-dark.png",
    fullPage: true,
  })
})
