"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useStore } from "@/components/providers"
import { PageSkeleton } from "@/components/page-skeleton"
import { EmptyState } from "@/components/empty-state"
import { FormField } from "@/components/form-field"
import { PasswordInput } from "@/components/password-input"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { useForm } from "@/hooks/use-form"
import { passwordSchema, profileSchema } from "@/lib/validation"
import { api, send } from "@/lib/api"
import { mutation } from "@/lib/notifications"
import type { User } from "@/lib/types"
export function AccountPage() {
  const { user, loading } = useStore()
  if (loading) return <PageSkeleton list />
  if (!user)
    return (
      <EmptyState title="請先登入">
        <Button render={<Link href="/login" />}>登入</Button>
      </EmptyState>
    )
  return <AccountForm key={user.id} user={user} />
}
function AccountForm({ user }: { user: User }) {
  const { setUser } = useStore(),
    router = useRouter(),
    profile = useForm(),
    password = useForm()
  const [name, setName] = useState(user.name),
    [values, setValues] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  return (
    <div className="max-w-2xl">
      <h1 className="mb-3 text-3xl font-semibold">帳號設定</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        {user.email} · {user.role === "admin" ? "管理員" : "會員"}
      </p>
      <form
        noValidate
        className="space-y-5 border-b pb-10"
        onSubmit={(e) => {
          e.preventDefault()
          void profile.submit(profileSchema, { name }, async (data) => {
            const result = await send<{ user: User }>(
              "/auth/profile",
              "PATCH",
              data
            )
            setUser(result.user)
          })
        }}
      >
        <h2 className="text-lg font-semibold">個人資料</h2>
        <FormField
          id="profile-name"
          label="姓名"
          required
          error={profile.errors.name}
        >
          <Input
            id="profile-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FieldError>{profile.errors.form}</FieldError>
        <Button type="submit" disabled={profile.pending}>
          儲存姓名
        </Button>
      </form>
      <form
        noValidate
        className="space-y-5 py-10"
        onSubmit={(e) => {
          e.preventDefault()
          void password.submit(
            passwordSchema,
            values,
            async (data) => {
              await send("/auth/password", "POST", data)
              setUser(null)
              router.push("/login")
            },
            "密碼已更新，請重新登入"
          )
        }}
      >
        <h2 className="text-lg font-semibold">修改密碼</h2>
        {(
          [
            ["currentPassword", "目前密碼"],
            ["newPassword", "新密碼"],
            ["confirmPassword", "再次輸入新密碼"],
          ] as const
        ).map(([key, label]) => (
          <FormField
            key={key}
            id={key}
            label={label}
            required
            error={password.errors[key]}
          >
            <PasswordInput
              id={key}
              required
              autoComplete={
                key === "currentPassword" ? "current-password" : "new-password"
              }
              value={values[key]}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
          </FormField>
        ))}
        <FieldError>{password.errors.form}</FieldError>
        <Button type="submit" disabled={password.pending}>
          更新密碼
        </Button>
      </form>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await mutation("登出中…", "已登出", () =>
              api("/auth/logout", { method: "POST", body: "{}" })
            )
            setUser(null)
            router.push("/")
          } catch {}
        }}
      >
        登出帳號
      </Button>
    </div>
  )
}
