"use client"

import Link from "next/link"

import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { HOME_LAYOUT } from "@/lib/home/designTokens"
import { cn } from "@/lib/utils"

type CompanyHomeButtonProps = {
  companyId: string
  companyName: string
}

export function CompanyHomeButton({ companyId, companyName }: CompanyHomeButtonProps) {
  const { navigate } = useAppRouteNavigation()
  const href = `/company/${companyId}/suscripciones`

  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault()
        navigate(href)
      }}
      className={cn(HOME_LAYOUT.topPillButton, "max-w-[min(100%,220px)]")}
    >
      <span className="truncate">{companyName}</span>
    </Link>
  )
}
