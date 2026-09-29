"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRight, Recycle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldError } from "@/components/ui/field"
import { FormField } from "@/components/form-field"
import { PasswordInput } from "@/components/password-input"
import { AppSelect } from "@/components/app-select"
import { useStore } from "@/components/providers"
import { useForm } from "@/hooks/use-form"
import { loginSchema, registerSchema } from "@/lib/validation"
import { send } from "@/lib/api"
import { platforms, type Contact, type User } from "@/lib/types"
export function AuthForm({ register = false }: { register?: boolean }) {
  const [values, setValues] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      contact: { platform: "LINE", account: "" } as Contact,
    }),
    [remember, setRemember] = useState(false)
  const { pending, errors, submit } = useForm(),
    { setUser } = useStore(),
    router = useRouter()
  useEffect(() => {
    if (!register) {
      try {
        const email = localStorage.getItem("thrift-remember-email")
        if (email) {
          setValues((v) => ({ ...v, email }))
          setRemember(true)
        }
      } catch {}
    }
  }, [register])
  const change = (
    key: "name" | "email" | "phone" | "password",
    value: string
  ) => setValues((v) => ({ ...v, [key]: value }))
  return (
    <div className="grid gap-12 py-6 md:grid-cols-2 md:gap-24 md:py-12">
      <div className="hidden flex-col justify-between gap-12 rounded-2xl bg-muted p-8 sm:p-12 md:flex">
        <div>
          <div className="mb-12 flex items-center gap-2 text-xs tracking-widest">
            <Recycle className="size-4" /> 二手物品
          </div>
          <h2 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            先逛逛，
            <br />
            喜歡再下單
            <br />
            帶回家！
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
            不用註冊也能買，留下聯繫方式就好。
            <br />
            想把訂單留在帳號裡，可以登入後再買。
          </p>
        </div>
        <p className="text-xs text-muted-foreground">THRIFT</p>
      </div>
      <div className="mx-auto w-full max-w-md py-3">
        <p className="text-xs tracking-widest text-muted-foreground">
          {register ? "會員註冊" : "會員登入"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          {register ? "註冊帳號" : "登入"}
        </h1>
        <p className="mt-3 mb-8 text-sm text-muted-foreground">
          {register
            ? "填好資料就能開始使用，不用等審核。"
            : "登入後可查看使用此帳號成立的訂單。"}
        </p>
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (register)
              void submit(
                registerSchema,
                values,
                async (data) => {
                  await send("/auth/register", "POST", data)
                  router.push("/login")
                },
                "註冊成功，請登入"
              )
            else
              void submit(
                loginSchema,
                values,
                async (data) => {
                  const result = await send<{ user: User }>(
                    "/auth/login",
                    "POST",
                    data
                  )
                  try {
                    if (remember)
                      localStorage.setItem("thrift-remember-email", data.email)
                    else localStorage.removeItem("thrift-remember-email")
                  } catch {}
                  setUser(result.user)
                  router.push("/")
                },
                "登入成功"
              )
          }}
        >
          {register && (
            <FormField id="name" label="姓名" required error={errors.name}>
              <Input
                id="name"
                required
                autoComplete="name"
                value={values.name}
                onChange={(e) => change("name", e.target.value)}
                aria-invalid={!!errors.name}
              />
            </FormField>
          )}
          <FormField id="email" label="電子信箱" required error={errors.email}>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={(e) => change("email", e.target.value)}
              aria-invalid={!!errors.email}
            />
          </FormField>
          {register && (
            <>
              <FormField
                id="phone"
                label="手機號碼"
                required
                error={errors.phone}
              >
                <Input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={values.phone}
                  onChange={(e) => change("phone", e.target.value)}
                />
              </FormField>
              <FormField
                id="platform"
                label="聯繫方式"
                required
                error={errors["contact.platform"]}
              >
                <AppSelect
                  id="platform"
                  required
                  value={values.contact.platform}
                  options={platforms}
                  onValueChange={(v) =>
                    setValues({
                      ...values,
                      contact: {
                        ...values.contact,
                        platform: v as Contact["platform"],
                      },
                    })
                  }
                />
              </FormField>
              <FormField
                id="contact-account"
                label="聯繫帳號或個人頁面連結"
                required
                error={errors["contact.account"]}
              >
                <Input
                  id="contact-account"
                  required
                  value={values.contact.account}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      contact: { ...values.contact, account: e.target.value },
                    })
                  }
                />
              </FormField>
            </>
          )}
          <FormField
            id="password"
            label="密碼"
            required
            error={errors.password}
            description={register ? "至少 12 個字元。" : undefined}
          >
            <PasswordInput
              id="password"
              required
              autoComplete={register ? "new-password" : "current-password"}
              value={values.password}
              onChange={(e) => change("password", e.target.value)}
              aria-invalid={!!errors.password}
            />
          </FormField>
          {!register && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(!!v)}
              />
              記住帳號
            </label>
          )}
          <FieldError>{errors.form}</FieldError>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "處理中…" : register ? "建立帳號" : "登入"}
            <ArrowRight />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {register ? "已經有帳號？" : "還沒有帳號？"}{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href={register ? "/login" : "/register"}
            >
              {register ? "登入" : "註冊帳號"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
