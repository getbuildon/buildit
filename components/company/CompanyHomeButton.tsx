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
      className="inline-flex max-w-[min(100%,160px)] items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:max-w-[220px] sm:px-3"
    >
      <Building2 className="size-[15px] shrink-0 text-white/70" aria-hidden />
      <span className="truncate">{companyName}</span>
    </Link>
  )
}
