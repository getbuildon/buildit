import Link from "next/link"

import { cn } from "@/lib/utils"

/** Figma node 1180:1343 — botón cambiar obra (24×24, bg #edeef0, icon 16×16 #afb3ba). */
export function SidebarSwitchProjectButton({ className }: { className?: string }) {
  return (
    <Link
      href="/home"
      aria-label="Cambiar de obra"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-[8px] bg-[#edeef0] p-1",
        "text-[#afb3ba] transition-colors duration-150",
        "hover:bg-[#e2e3e5] hover:text-[#696e77]",
        "active:scale-95 active:bg-[#d8d9db]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18191b]/20 focus-visible:ring-offset-1",
        className,
      )}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="block shrink-0"
      >
        <path
          d="M10.6667 7.33333L13.3333 4.66667L10.6667 2M13.3333 4.66667H2.66667M5.33333 8.66667L2.66667 11.3333L5.33333 14M2.66667 11.3333H13.3333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  )
}
