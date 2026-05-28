import { cn } from "@/lib/utils"

type BuiltItIsoIconProps = {
  className?: string
}

export function BuiltItIsoIcon({ className }: BuiltItIsoIconProps) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M7 25.6668V4.66683C7 4.04799 7.24583 3.4545 7.68342 3.01691C8.121 2.57933 8.71449 2.3335 9.33333 2.3335H18.6667C19.2855 2.3335 19.879 2.57933 20.3166 3.01691C20.7542 3.4545 21 4.04799 21 4.66683V25.6668H7Z"
        stroke="currentColor"
        strokeWidth="2.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 14H4.66667C4.04783 14 3.45434 14.2458 3.01675 14.6834C2.57917 15.121 2.33334 15.7145 2.33334 16.3333V23.3333C2.33334 23.9522 2.57917 24.5457 3.01675 24.9832C3.45434 25.4208 4.04783 25.6667 4.66667 25.6667H7"
        stroke="currentColor"
        strokeWidth="2.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 10.5H23.3333C23.9522 10.5 24.5457 10.7458 24.9832 11.1834C25.4208 11.621 25.6667 12.2145 25.6667 12.8333V23.3333C25.6667 23.9522 25.4208 24.5457 24.9832 24.9832C24.5457 25.4208 23.9522 25.6667 23.3333 25.6667H21"
        stroke="currentColor"
        strokeWidth="2.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6667 7H16.3333"
        stroke="currentColor"
        strokeWidth="2.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6667 11.6665H16.3333"
        stroke="currentColor"
        strokeWidth="2.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6667 16.3335H16.3333"
        stroke="currentColor"
        strokeWidth="2.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6667 21H16.3333"
        stroke="currentColor"
        strokeWidth="2.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
