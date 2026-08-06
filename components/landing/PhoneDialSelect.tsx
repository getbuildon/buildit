"use client"

import Image from "next/image"
import type { ReactNode } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getPhoneDialOption,
  PHONE_DIAL_OPTIONS,
  type PhoneDialCode,
} from "@/lib/landing/phoneInput"

type PhoneDialSelectProps = {
  value: PhoneDialCode
  onValueChange: (value: PhoneDialCode) => void
}

export function PhoneDialSelect({ value, onValueChange }: PhoneDialSelectProps) {
  const option = getPhoneDialOption(value)

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label="Código de país telefónico"
        className="h-auto w-auto shrink-0 rounded-none border-0 border-r border-[#dee5ed] bg-transparent p-0 pr-2 shadow-none focus:ring-0 data-[size=default]:h-auto [&>:first-child]:flex-none [&>svg:last-child]:hidden"
      >
        <span className="flex items-center gap-1">
          <SelectValue aria-label={option.label}>
            <span aria-hidden className="text-base leading-none text-black">
              {option.flag}
            </span>
          </SelectValue>
          <Image
            src="/landing/contract/chevron-down-sm.svg"
            alt=""
            width={10}
            height={10}
            aria-hidden
            className="size-2.5 shrink-0"
          />
        </span>
      </SelectTrigger>
      <SelectContent align="start">
        {PHONE_DIAL_OPTIONS.map((dialOption) => (
          <SelectItem key={dialOption.value} value={dialOption.value}>
            <span className="flex items-center gap-2">
              <span aria-hidden>{dialOption.flag}</span>
              <span>{dialOption.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function PhoneInputShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[46px] w-full items-center gap-2 rounded-[10px] border border-[#edeef0] bg-white px-4">
      {children}
    </div>
  )
}

export const phoneNumberInputClassName =
  "h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-base leading-[1.4] text-[#18191b] shadow-none placeholder:text-[#777b84] focus-visible:border-0 focus-visible:ring-0"
