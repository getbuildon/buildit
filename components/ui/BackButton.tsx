"use client"

import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** Figma 1850:6347 (panel) · create-project flow default */
const backButtonVariants = cva(
  "inline-flex w-fit items-center no-underline transition-opacity hover:opacity-70",
  {
    variants: {
      variant: {
        default: "gap-2 text-[16px] font-normal leading-6 text-[#18191b]",
        panel: "gap-1 py-0.5 text-[14px] font-medium leading-[1.4] text-[#43484e]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type BackButtonProps = {
  href: string
  label?: string
  className?: string
} & VariantProps<typeof backButtonVariants>

export function BackButton({
  href,
  label = "Volver",
  variant,
  className,
}: BackButtonProps) {
  return (
    <Link href={href} className={cn(backButtonVariants({ variant }), className)}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="block shrink-0"
      >
        <path
          d="M7.99992 12.6673L3.33325 8.00065L7.99992 3.33398"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.6666 8H3.33325"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  )
}
