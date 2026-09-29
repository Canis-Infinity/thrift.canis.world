"use client"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/form-field"
import { AppSelect } from "@/components/app-select"
import { platforms, type Contact } from "@/lib/types"
export type Customer = { name: string; contact: Contact }
export function CustomerFields({
  value,
  onChange,
  errors,
  prefix = "customer",
}: {
  value: Customer
  onChange: (v: Customer) => void
  errors: Record<string, string>
  prefix?: string
}) {
  return (
    <>
      <FormField
        id={`${prefix}-name`}
        label="姓名"
        required
        error={errors[`${prefix}.name`]}
      >
        <Input
          id={`${prefix}-name`}
          required
          autoComplete="name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <FormField
          id={`${prefix}-platform`}
          label="聯繫方式"
          required
          error={errors[`${prefix}.contact.platform`]}
        >
          <AppSelect
            id={`${prefix}-platform`}
            required
            value={value.contact.platform}
            options={platforms}
            onValueChange={(v) =>
              onChange({
                ...value,
                contact: {
                  ...value.contact,
                  platform: v as Contact["platform"],
                },
              })
            }
          />
        </FormField>
        <FormField
          id={`${prefix}-account`}
          label="聯繫帳號或個人頁面連結"
          required
          error={errors[`${prefix}.contact.account`]}
        >
          <Input
            id={`${prefix}-account`}
            required
            value={value.contact.account}
            onChange={(e) =>
              onChange({
                ...value,
                contact: { ...value.contact, account: e.target.value },
              })
            }
          />
        </FormField>
      </div>
    </>
  )
}
