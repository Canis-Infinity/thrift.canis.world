import { z } from "zod"
const name = z.string().trim().min(1, "此欄位為必填").max(80, "最多 80 字")
const password = z
  .string()
  .min(12, "密碼至少 12 個字元")
  .max(72, "密碼最多 72 個字元")
  .refine((v) => new TextEncoder().encode(v).length <= 72, "密碼最多 72 bytes")
export const contactSchema = z.object({
  platform: z.enum(["IG", "LINE", "facebook", "Discord", "Threads"]),
  account: z.string().trim().min(1, "請輸入聯繫帳號").max(200),
})
export const customerSchema = z.object({ name, contact: contactSchema })
export const loginSchema = z.object({
  email: z.email("請輸入有效信箱"),
  password: z.string().min(1, "請輸入密碼"),
})
export const registerSchema = loginSchema.extend({
  name,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{8,20}$/, "請輸入有效手機號碼"),
  contact: contactSchema,
  password,
})
export const profileSchema = z.object({ name })
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "請輸入目前密碼"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "兩次密碼不一致",
  })
export const productSchema = z.object({
  name,
  price: z.number().int("金額須為整數").min(0).max(999999999),
  description: z.string().max(20000),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .min(1, "至少輸入一個標籤")
    .max(20),
  images: z.array(z.string()).min(1, "至少上傳一張商品照片").max(10),
  quantity: z.number().int("數量須為整數").min(0).max(99999),
  category: z.string().nullable(),
  active: z.boolean(),
})
export const categorySchema = z.object({ name, parent: z.string().nullable() })
export const itemsSchema = z
  .array(
    z.object({
      product: z.string().min(1, "請選擇商品"),
      quantity: z.number().int().min(1, "數量至少為 1").max(99999),
    })
  )
  .min(1, "至少選擇一件商品")
  .max(50)
  .refine(
    (v) => new Set(v.map((i) => i.product)).size === v.length,
    "商品不可重複"
  )
export const checkoutSchema = z.object({
  customer: customerSchema,
  items: itemsSchema,
  note: z.string().max(2000),
})
export const orderUpdateSchema = z
  .object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
    note: z.string().trim().max(2000),
  })
  .strict()
export const orderSchema = checkoutSchema.extend({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
})
