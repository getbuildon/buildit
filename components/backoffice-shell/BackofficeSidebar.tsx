"use client"

import Image from "next/image"
import Link from "next/link"
import { PanelLeftClose } from "lucide-react"
import { usePathname } from "next/navigation"

import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import {
  BACKOFFICE_NAV_ITEMS,
  backofficeHref,
  isBackofficeNavActive,
} from "@/lib/backoffice/navigation"
import { UserAvatar } from "@/components/user/UserAvatar"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"

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
    <div className="flex h-screen w-[220px] shrink-0 flex-col bg-[#111113]">
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

      <nav className="flex flex-1 flex-col gap-1 px-2.5 pt-3">
        {BACKOFFICE_NAV_ITEMS.map((item) => {
          const href = backofficeHref(item.segment)
          const active = isBackofficeNavActive(pathname, item.segment)
          const Icon = item.icon

          return (
            <Link
              key={item.segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.25 text-[13px] font-medium leading-[19.5px] transition-colors",
                active
                  ? "bg-[#ff7433] text-white"
                  : "text-[#afb3ba] hover:bg-white/6 hover:text-white",
              )}
            >
              <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div
        className="shrink-0 border-t px-2.5 pb-3.5 pt-3"
        style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
      >
        <div className="flex items-center gap-2.25 px-2.5 py-2">
          <UserAvatar
            firstName={userProfile.firstName}
            lastName={userProfile.lastName}
            email={userProfile.email}
            avatarUrl={userProfile.avatarUrl}
            size={28}
            className="border border-[rgba(255,116,51,0.4)]"
            bgClassName="bg-[rgba(255,116,51,0.2)]"
            textClassName="text-[10px] font-semibold leading-[15px] text-[#ff7433]"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium leading-[1.4] text-white">
              {userProfile.fullName}
            </p>
            <p className="truncate text-[10px] leading-[1.4] tracking-[-0.5px] text-[#afb3ba]">
              {userProfile.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
