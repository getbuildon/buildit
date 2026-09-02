"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { HomeCompanyOption } from "@/app/home/actions"
import { formatCompanyRole } from "@/lib/company/formatCompanyRole"
import { HOME_LAYOUT } from "@/lib/home/designTokens"
import { cn } from "@/lib/utils"

type CompanyHomeButtonProps = {
  companyId: string
  companyName: string
  companies?: HomeCompanyOption[]
}

function companyHref(companyId: string) {
  return `/company/${companyId}/suscripciones`
}

export function CompanyHomeButton({
  companyId,
  companyName,
  companies = [],
}: CompanyHomeButtonProps) {
  const { navigate } = useAppRouteNavigation()
  const [open, setOpen] = useState(false)
  const hasMenu = companies.length > 1

  if (!hasMenu) {
    const href = companyHref(companyId)
    return (
      <Link
        href={href}
        onClick={(event) => {
          event.preventDefault()
          navigate(href)
        }}
        className={cn(HOME_LAYOUT.topPillButton, "min-w-0 max-w-[7.5rem] sm:max-w-[220px]")}
      >
        <span className="truncate">{companyName}</span>
      </Link>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Cambiar de empresa"
        className={cn(
          HOME_LAYOUT.topPillButton,
          "min-w-0 max-w-[9.5rem] gap-1 sm:max-w-[240px] sm:gap-1.5",
          open && "bg-[#3d2114]",
        )}
      >
        <span className="truncate">{companyName}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-white/80 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto min-w-[220px] max-w-[280px] p-1"
      >
        <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-[#777b84]">
          Empresas
        </p>
        {companies.map((company) => {
          const href = companyHref(company.id)
          return (
            <Link
              key={company.id}
              href={href}
              onClick={(event) => {
                event.preventDefault()
                setOpen(false)
                navigate(href)
              }}
              className="flex w-full items-center rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-[#edeef0]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium leading-5 text-[#272a2d]">
                  {company.name}
                </span>
                <span className="block text-[12px] leading-4 text-[#777b84]">
                  {formatCompanyRole(company.role)}
                </span>
              </span>
            </Link>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
