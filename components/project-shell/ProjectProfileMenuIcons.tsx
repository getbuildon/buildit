import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const STROKE = 1.33333

function MenuIconSvg({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("size-4 shrink-0", className)}
    >
      {children}
    </svg>
  )
}

/** Figma 1157:3316 — Mi Perfil */
export function ProfileMenuProfileIcon({ className }: { className?: string }) {
  return (
    <MenuIconSvg className={className}>
      <path
        d="M12.6667 14V12.6667C12.6667 11.9594 12.3857 11.2811 11.8856 10.781C11.3855 10.281 10.7072 10 10 10H6C5.29276 10 4.61448 10.281 4.11438 10.781C3.61428 11.2811 3.33333 11.9594 3.33333 12.6667V14"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 7.33333C9.47276 7.33333 10.6667 6.13943 10.6667 4.66667C10.6667 3.19391 9.47276 2 8 2C6.52724 2 5.33333 3.19391 5.33333 4.66667C5.33333 6.13943 6.52724 7.33333 8 7.33333Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </MenuIconSvg>
  )
}

/** Figma 1157:3321 — Cerrar sesión */
export function ProfileMenuLogoutIcon({ className }: { className?: string }) {
  return (
    <MenuIconSvg className={className}>
      <path
        d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6667 11.3333L14 8L10.6667 4.66667"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8H6"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </MenuIconSvg>
  )
}
