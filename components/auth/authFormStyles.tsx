import type { ReactNode } from "react"

import { LOGIN_TYPE } from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"

export const AUTH_FORM_SHELL_CLASSNAME = "mx-auto w-full max-w-[446px]"

export const AUTH_FORM_CARD_CLASSNAME =
  "w-full rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]"

export const AUTH_FORM_TITLE_CLASSNAME = LOGIN_TYPE.cardTitle

export const AUTH_INPUT_CLASSNAME = cn(
  "h-11 w-full rounded-[10px] border bg-transparent pl-10 shadow-none sm:h-[46px]",
  LOGIN_TYPE.fieldInput,
  "placeholder:text-[#696E77] focus-visible:ring-0",
)

export const AUTH_PASSWORD_INPUT_CLASSNAME = cn(AUTH_INPUT_CLASSNAME, "pr-10")

export function AuthFieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#696E77]">
      {children}
    </span>
  )
}

export function AuthFieldToggle({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="absolute inset-y-0 right-3 flex items-center text-[#696E77]"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}
