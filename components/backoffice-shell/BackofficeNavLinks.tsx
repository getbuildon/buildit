"use client"

import Link from "next/link"

import {
  BACKOFFICE_NAV_ITEMS,
  backofficeHref,
  isBackofficeNavActive,
} from "@/lib/backoffice/navigation"
import { cn } from "@/lib/utils"

type BackofficeNavLinksProps = {
  pathname: string
  onNavigate?: () => void
  className?: string
  linkClassName?: string
}

export function BackofficeNavLinks({
  pathname,
  onNavigate,
  className,
  linkClassName,
}: BackofficeNavLinksProps) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {BACKOFFICE_NAV_ITEMS.map((item) => {
        const href = backofficeHref(item.segment)
        const active = isBackofficeNavActive(pathname, item.segment)
        const Icon = item.icon

        return (
          <Link
            key={item.segment}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.25 text-[13px] font-medium leading-[19.5px] transition-colors",
              active
                ? "bg-[#ff7433] text-white"
                : "text-[#afb3ba] hover:bg-white/6 hover:text-white",
              linkClassName,
            )}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
