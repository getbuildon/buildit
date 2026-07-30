"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"

type CompanyHomeButtonProps = {
  companyId: string
  companyName: string
}

export function CompanyHomeButton({ companyId, companyName }: CompanyHomeButtonProps) {
  return (
    <Link
      href={`/company/${companyId}/suscripciones`}
      className="inline-flex max-w-[min(100%,160px)] items-center gap-2 rounded-[8px] border border-white/20 bg-white/10 px-2.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/15 sm:max-w-[220px] sm:px-3"
    >
      <Building2 className="size-[15px] shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{companyName}</span>
    </Link>
  )
}
