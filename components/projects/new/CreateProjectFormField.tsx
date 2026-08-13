import type { CSSProperties, ReactElement, ReactNode } from "react"
import { Children, cloneElement, isValidElement } from "react"
import { cn } from "@/lib/utils"
import { FieldErrorTooltip } from "@/components/ui/field-error-tooltip"
import {
  CREATE_PROJECT_COLORS,
  CREATE_PROJECT_LAYOUT,
  CREATE_PROJECT_TYPE,
} from "@/lib/projects/createProjectTokens"

type CreateProjectFormFieldProps = {
  label: ReactNode
  htmlFor?: string
  children: ReactNode
  className?: string
  labelClassName?: string
  labelStyle?: CSSProperties
  error?: string | null
  errorDisplay?: "inline" | "tooltip"
}

export const CREATE_PROJECT_FIELD_ERROR_BORDER_COLOR = "#eb8e90"

export const createProjectFieldErrorInputClassName =
  "border-2 border-[#eb8e90] focus-visible:border-[#eb8e90] focus-visible:ring-0"

export const createProjectFieldErrorInputStyle = {
  borderColor: CREATE_PROJECT_FIELD_ERROR_BORDER_COLOR,
  borderWidth: 2,
} as const

function applyFieldErrorToChild(child: ReactNode, error?: string | null): ReactNode {
  if (!error || !isValidElement(child)) return child

  const element = child as ReactElement<{
    className?: string
    style?: CSSProperties
    "aria-invalid"?: boolean
  }>

  return cloneElement(element, {
    className: cn(element.props.className, createProjectFieldErrorInputClassName),
    "aria-invalid": true,
    style: {
      ...element.props.style,
      ...createProjectFieldErrorInputStyle,
    },
  })
}

export function CreateProjectFormField({
  label,
  htmlFor,
  children,
  className,
  labelClassName,
  labelStyle,
  error,
  errorDisplay = "inline",
}: CreateProjectFormFieldProps) {
  const showInlineError = Boolean(error) && errorDisplay === "inline"
  const showTooltipError = Boolean(error) && errorDisplay === "tooltip"
  const child = Children.only(children)

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-1">
        <label
          htmlFor={htmlFor}
          className={labelClassName ?? CREATE_PROJECT_TYPE.fieldLabel}
          style={labelStyle ?? { color: CREATE_PROJECT_COLORS.label }}
        >
          {label}
        </label>
        {showTooltipError && error ? <FieldErrorTooltip message={error} /> : null}
      </div>
      {applyFieldErrorToChild(child, error)}
      {errorDisplay === "inline" ? (
        <p
          className={cn(
            "min-h-4 text-[12px] leading-4",
            showInlineError ? "text-[#b91c1c]" : "invisible",
          )}
          role={showInlineError ? "alert" : undefined}
          aria-hidden={!showInlineError}
        >
          {error ?? "\u00A0"}
        </p>
      ) : null}
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

export const createProjectDatePickerClassName = cn(
  createProjectInputClassName,
  "h-[46px] px-3",
)

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
