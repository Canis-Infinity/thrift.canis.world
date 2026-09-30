"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Option = { value: string; label: string; icon?: LucideIcon }
export function AppSelect({
  id,
  label,
  value,
  onValueChange,
  options,
  disabled,
  required,
  invalid,
  describedBy,
  className,
  renderOption,
}: {
  id?: string
  label?: string
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  describedBy?: string
  className?: string
  renderOption?: (option: Option) => ReactNode
}) {
  const selected = options.find((option) => option.value === value)
  const Icon = selected?.icon
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next)
      }}
      disabled={disabled}
      required={required}
      name={required ? id : undefined}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={className}
      >
        <SelectValue>
          {Icon && <Icon aria-hidden="true" />}
          {selected?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={!renderOption}
        align={renderOption ? "start" : "center"}
        className={renderOption ? "w-80 max-w-[calc(100vw-2rem)]" : undefined}
      >
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={
                renderOption
                  ? "[&>span:first-child]:min-w-0 [&>span:first-child]:shrink"
                  : undefined
              }
            >
              {renderOption ? (
                renderOption(option)
              ) : (
                <>
                  {option.icon && <option.icon aria-hidden="true" />}
                  {option.label}
                </>
              )}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
