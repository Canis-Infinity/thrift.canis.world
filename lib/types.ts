export type Contact = {
  platform: "IG" | "LINE" | "facebook" | "Discord"
  account: string
}
export type User = {
  id: string
  name: string
  email: string
  phone: string
  contact?: Contact
  role: "admin" | "user"
  status: "active" | "suspended"
  version: number
}
export type Product = {
  id: string
  name: string
  price: number
  description: string
  tags: string[]
  images: string[]
  quantity: number
  category: string | null
  active: boolean
  version: number
  createdAt: string
}
export type Category = {
  id: string
  name: string
  parent: string | null
  version: number
}
export type OrderItem = {
  product: string
  image?: string | null
  name: string
  price: number
  quantity: number
}
export type Order = {
  id: string
  token: string
  number: string
  customer: { name: string; contact: Contact }
  items: OrderItem[]
  total: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  note: string
  version: number
  createdAt: string
}
export type Catalog = { products: Product[]; categories: Category[] }
export type AdminData = Catalog & { orders: Order[]; users: User[] }
export type CartItem = { product: string; quantity: number }
export const money = (value: number) =>
  `NT$ ${new Intl.NumberFormat("zh-TW").format(value)}`
export const statuses = {
  pending: "待聯繫",
  confirmed: "已確認",
  completed: "已完成",
  cancelled: "已取消",
}
export const platforms = ["IG", "LINE", "facebook", "Discord"].map((value) => ({
  value,
  label: value,
}))
