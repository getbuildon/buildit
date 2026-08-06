"use client"

import Image from "next/image"
import Link from "next/link"
import { CircleUserRound } from "lucide-react"

import { useLandingActions } from "@/components/landing/LandingActionsProvider"
import { handleLandingNavClick } from "@/lib/landing/handleLandingNavClick"
import { LANDING_HEADER_NAV_LINKS } from "@/lib/landing/headerNavLinks"

export function LandingHeaderDesktop() {
  const { openContactModal, scrollToPlans } = useLandingActions()

  return (
    <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-4 lg:px-10 xl:px-20">
      <div className="flex min-w-0 items-center gap-6 lg:gap-10">
        <Link href="/" aria-label="BuildOn — inicio">
          <Image
            src="/landing/logo-build-on.svg"
            alt="BuildOn"
            width={120}
            height={25}
            priority
            className="h-[25px] w-[120px]"
          />
        </Link>

        <nav className="flex items-center gap-4 xl:gap-8">
          {LANDING_HEADER_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm leading-[1.4] text-[#363a3f] transition-colors hover:text-[#272a2d]"
              onClick={(event) =>
                handleLandingNavClick(event, link.sectionId)
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 rounded-[14px] px-3 py-2.5 text-sm leading-[1.4] text-[#272a2d] transition-colors hover:bg-[#fff6f1]"
        >
          <CircleUserRound className="size-4" strokeWidth={1.75} />
          Iniciar sesión
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openContactModal}
            className="rounded-[10px] bg-[#edeef0] px-4 py-2.5 text-sm font-medium leading-[1.4] text-[#272a2d] transition-colors hover:bg-[#e4e5e8]"
          >
            Solicitar demo
          </button>
          <button
            type="button"
            onClick={scrollToPlans}
            className="rounded-[10px] bg-[#272a2d] px-5 py-2.5 text-sm font-medium leading-[1.4] text-white transition-colors hover:bg-[#363a3f]"
          >
            Ver planes
          </button>
        </div>
      </div>
    </div>
  )
}
