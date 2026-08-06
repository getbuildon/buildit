"use client"

import { PanelLeftClose } from "lucide-react"
import { usePathname } from "next/navigation"

import { BackofficeBrandLink } from "@/components/backoffice-shell/BackofficeBrandLink"
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
          <BackofficeBrandLink className="min-w-0 flex-1" />
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
