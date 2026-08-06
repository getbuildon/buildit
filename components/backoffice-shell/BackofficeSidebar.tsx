"use client"

import Image from "next/image"
import { PanelLeftClose } from "lucide-react"
import { usePathname } from "next/navigation"

import { BackofficeNavLinks } from "@/components/backoffice-shell/BackofficeNavLinks"
import { BackofficeUserFooter } from "@/components/backoffice-shell/BackofficeUserFooter"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"

type BackofficeSidebarProps = {
  userProfile: SidebarUserProfile
  onToggleSidebar: () => void
}

export function BackofficeSidebar({
  userProfile,
  onToggleSidebar,
}: BackofficeSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full min-h-0 w-[220px] shrink-0 flex-col overflow-hidden bg-[#111113]">
      <div
        className="shrink-0 border-b px-[18px] pb-[21px] pt-5"
        style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-[#212225]">
              <Image
                src="/backoffice/buildon-iso.svg"
                alt=""
                width={20}
                height={15}
                aria-hidden
                className="absolute left-1/2 top-1/2 h-[14.5px] w-5 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-[15.6px] text-white">
                BuildOn
              </p>
              <p className="text-xs leading-[1.4] tracking-[-0.36px] text-[#777b84]">
                Administración
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#afb3ba] transition-colors hover:bg-white/6 hover:text-white"
            aria-label="Ocultar menú"
          >
            <PanelLeftClose className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <BackofficeNavLinks
        pathname={pathname}
        className="min-h-0 flex-1 overflow-y-auto px-2.5 pt-3"
      />

      <BackofficeUserFooter userProfile={userProfile} />
    </div>
  )
}
