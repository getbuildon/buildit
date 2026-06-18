import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_LAYOUT,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"

type CreateProjectFormFieldProps = {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
  labelClassName?: string
  labelStyle?: CSSProperties
}

export function CreateProjectFormField({
  label,
  htmlFor,
  children,
  className,
  labelClassName,
  labelStyle,
}: CreateProjectFormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className={labelClassName ?? CREATE_PROJECT_TYPE.fieldLabel}
        style={labelStyle ?? { color: CREATE_PROJECT_COLORS.label }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export const createProjectInputClassName = cn(
  CREATE_PROJECT_TYPE.fieldInput,
  "h-[46px] w-full rounded-[10px] border px-4 shadow-none",
  "bg-transparent text-[#18191b]",
  "placeholder:text-[#777b84]",
  "focus-visible:border-[#ff7433] focus-visible:ring-0",
)

export const createProjectInputStyle = {
  borderColor: CREATE_PROJECT_COLORS.inputBorder,
  height: CREATE_PROJECT_LAYOUT.inputHeight,
} as const

export const createProjectCompactInputClassName = cn(
  CREATE_PROJECT_TYPE.fieldInput,
  "h-10 w-full min-w-0 rounded-[10px] border px-3 text-[14px] shadow-none",
  "bg-transparent text-[#18191b]",
  "placeholder:text-[#777b84]",
  "outline-none focus:outline-none focus:border-[#ff7433]",
  "focus-visible:border-[#ff7433] focus-visible:ring-0 focus-visible:outline-none",
)

export const createProjectCompactInputStyle = {
  borderColor: CREATE_PROJECT_COLORS.inputBorder,
} as const

export const createProjectSelectClassName = cn(
  createProjectCompactInputClassName,
  "appearance-none pr-8",
)
