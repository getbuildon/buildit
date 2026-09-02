import { cloneElement, isValidElement, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type RequiredFieldCueProps = {
  show: boolean
  className?: string
  markClassName?: string
  children: ReactNode
}

export function RequiredFieldCue({
  show,
  className,
  markClassName,
  children,
}: RequiredFieldCueProps) {
  const child = isValidElement<{ className?: string }>(children)
    ? cloneElement(children, {
        className: cn(children.props.className, show && "pr-8"),
      })
    : children

  return (
    <div className={cn("relative min-w-0", className)}>
      {child}
      {show ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[14px] font-medium leading-none text-[#ff7433]",
            markClassName,
          )}
        >
          *
        </span>
      ) : null}
    </div>
  )
}

export function RequiredFieldsLegend({ className }: { className?: string }) {
  return (
    <p className={cn("text-[12px] leading-4 text-[#777b84]", className)}>
      <span aria-hidden className="mr-1 font-medium text-[#ff7433]">
        *
      </span>
      Requerido
    </p>
  )
}
