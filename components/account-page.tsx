"use client"
import { UserRound, KeyRound, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
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
  const [signingOut, setSigningOut] = useState(false)
  const [name, setName] = useState(user.name),
    [values, setValues] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  return (
    <div className="max-w-5xl">
      <div className="border-b pb-7">
        <h1 className="text-3xl font-semibold">帳號設定</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="break-all">{user.email}</span>
          <Badge variant="secondary">
            {user.role === "admin" ? "管理員" : "會員"}
          </Badge>
        </div>
      </div>
      <section
        aria-labelledby="profile-heading"
        className="grid gap-6 border-b py-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10"
      >
        <div>
          <h2
            id="profile-heading"
            className="flex items-center gap-2 font-semibold"
          >
            <UserRound className="size-4" />
            個人資料
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            更新帳號使用的姓名。
          </p>
        </div>
        <form
          noValidate
          className="w-full max-w-lg space-y-5"
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
            {profile.pending && <Spinner />}
            {profile.pending ? "儲存中…" : "儲存姓名"}
          </Button>
        </form>
      </section>
      <section
        aria-labelledby="password-heading"
        className="grid gap-6 border-b py-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10"
      >
        <div>
          <h2
            id="password-heading"
            className="flex items-center gap-2 font-semibold"
          >
            <KeyRound className="size-4" />
            修改密碼
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            新密碼至少 12 個字元。
            <br />
            更新後需要重新登入。
          </p>
        </div>
        <form
          noValidate
          className="w-full max-w-lg space-y-5"
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
                  key === "currentPassword"
                    ? "current-password"
                    : "new-password"
                }
                value={values[key]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
              />
            </FormField>
          ))}
          <FieldError>{password.errors.form}</FieldError>
          <Button type="submit" disabled={password.pending}>
            {password.pending && <Spinner />}
            {password.pending ? "更新中…" : "更新密碼"}
          </Button>
        </form>
      </section>
      <section
        aria-labelledby="session-heading"
        className="grid gap-6 py-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10"
      >
        <div>
          <h2 id="session-heading" className="font-semibold">
            登出
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            在共用裝置上，使用完記得登出。
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            disabled={signingOut || profile.pending || password.pending}
            onClick={async () => {
              setSigningOut(true)
              try {
                await mutation("登出中…", "已登出", () =>
                  api("/auth/logout", { method: "POST", body: "{}" })
                )
                setUser(null)
                router.push("/")
              } catch {
              } finally {
                setSigningOut(false)
              }
            }}
          >
            {signingOut ? <Spinner /> : <LogOut />}
            {signingOut ? "登出中…" : "登出帳號"}
          </Button>
        </div>
      </section>
    </div>
  )
}
