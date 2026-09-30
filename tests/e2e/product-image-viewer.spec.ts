import { test, expect } from "@playwright/test"

for (const width of [1440, 390, 320]) {
  test(`${width}px 可放大商品照片、切換並回到商品詳情`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 })
    const requests: string[] = []
    await page.route("**/_next/image?**", async (route) => {
      requests.push(route.request().url())
      await route.fulfill({ path: "public/icons/icon-512.png" })
    })
    await page.route("**/api/thrift/**", (route) =>
      route.fulfill({
        json: route.request().url().endsWith("/auth/me")
          ? { user: null }
          : {
              products: [
                {
                  id: "sample",
                  name: "測試收藏",
                  price: 350,
                  quantity: 5,
                  active: true,
                  version: 1,
                  images: ["photo-one", "photo-two"],
                  tags: ["收藏"],
                  category: null,
                  description: "商品說明",
                  createdAt: "2026-01-01",
                },
              ],
              categories: [],
            },
      })
    )
    await page.goto("/")
    await page.locator("#collection h3").click()
    await page.getByLabel(/^數量/).fill("2")
    expect(requests.every((url) => !url.includes("photo-two"))).toBe(true)
    const trigger = page.getByRole("button", {
      name: "放大檢視 測試收藏 的照片",
    })
    await trigger.click()
    const viewer = page.getByRole("dialog", {
      name: "測試收藏・照片",
      exact: true,
    })
    await expect(viewer).toBeVisible()
    await expect(
      viewer.getByRole("img", { name: "測試收藏，照片 1" })
    ).toBeVisible()
    await expect(
      viewer.getByRole("button", { name: "上一張照片" })
    ).toBeDisabled()
    const viewport = viewer.getByRole("region", { name: "放大照片檢視區" })
    const percent = viewer.getByLabel("縮放倍率")
    await viewer.getByRole("button", { name: "放大照片", exact: true }).click()
    await expect(percent).toHaveText("110%")
    await viewer.getByRole("button", { name: "放大照片", exact: true }).click()
    await expect(percent).toHaveText("120%")
    await viewer.getByRole("button", { name: "縮小照片", exact: true }).click()
    await expect(percent).toHaveText("110%")
    await viewer.getByRole("button", { name: "還原照片" }).click()
    await expect(percent).toHaveText("100%")
    await viewport.dblclick()
    await expect(percent).toHaveText("150%")
    const photo = viewer.getByRole("img", { name: "測試收藏，照片 1" })
    const before = await photo.boundingBox()
    const box = (await viewport.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      box.x + box.width / 2 + 45,
      box.y + box.height / 2 + 35,
      { steps: 8 }
    )
    await page.mouse.up()
    await expect
      .poll(async () => (await photo.boundingBox())!.x)
      .not.toBe(before!.x)
    await viewport.dblclick()
    await expect(percent).toHaveText("100%")
    if (width >= 1000) {
      await viewport.hover()
      await page.mouse.wheel(0, -250)
      await expect(percent).toHaveText("110%")
      await viewport.dblclick()
      await expect(percent).toHaveText("100%")
    } else {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true })
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2
      const touches = (spread: number) => [
        { x: x - spread, y, id: 1 },
        { x: x + spread, y, id: 2 },
      ]
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: touches(35),
      })
      for (const spread of [40, 50, 60, 70])
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: touches(spread),
        })
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      })
      await expect
        .poll(async () => parseInt((await percent.textContent())!))
        .toBeGreaterThan(150)
      const touchBefore = await photo.boundingBox()
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y, id: 1 }],
      })
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + 35, y: y + 25, id: 1 }],
      })
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      })
      await expect
        .poll(async () => (await photo.boundingBox())!.x)
        .not.toBe(touchBefore!.x)
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false })
    }
    await viewer.getByRole("button", { name: "下一張照片" }).click()
    await expect(
      viewer.getByRole("img", { name: "測試收藏，照片 2" })
    ).toBeVisible()
    await expect(
      viewer.getByRole("button", { name: "下一張照片" })
    ).toBeDisabled()
    await expect(
      viewer.getByRole("button", { name: "放大照片", exact: true })
    ).toBeEnabled()
    await expect(percent).toHaveText("100%")
    await page.screenshot({
      path: test.info().outputPath(`viewer-${width}.png`),
    })
    expect(
      await viewer.evaluate((e) => {
        const r = e.getBoundingClientRect()
        return (
          r.left >= 0 &&
          r.right <= innerWidth &&
          r.top >= 0 &&
          r.bottom <= innerHeight
        )
      })
    ).toBe(true)
    await page.keyboard.press("Escape")
    await expect(viewer).toBeHidden()
    await expect(
      page.getByRole("dialog", { name: "測試收藏", exact: true })
    ).toBeVisible()
    await expect(page.getByLabel(/^數量/)).toHaveValue("2")
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.getByRole("button", { name: "關閉照片", exact: true }).click()
    await expect(viewer).toBeHidden()
  })
}
