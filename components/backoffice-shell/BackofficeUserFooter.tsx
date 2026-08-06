"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, UserCircle } from "lucide-react"

import { UserAvatar } from "@/components/user/UserAvatar"
import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { useAuth } from "@/context/AuthContextSupabase"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"

type BackofficeUserFooterProps = {
  userProfile: SidebarUserProfile
  className?: string
}

export function BackofficeUserFooter({
  userProfile,
  className,
}: BackofficeUserFooterProps) {
  const { logOut } = useAuth()
  const router = useRouter()
  const { navigate } = useAppRouteNavigation()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const handleLogout = async () => {
    setIsOpen(false)
    await logOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div
      ref={ref}
      className={cn("relative border-t px-2.5 pb-3.5 pt-3", className)}
      style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex w-full items-center gap-2.25 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/6",
          isOpen && "bg-white/6",
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium leading-[1.4] text-white">
            {userProfile.fullName}
          </p>
          <p className="truncate text-[10px] leading-[1.4] tracking-[-0.5px] text-[#afb3ba]">
            {userProfile.email}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-[#afb3ba] transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+4px)] left-2.5 right-2.5 overflow-hidden rounded-xl border border-[#2a2b2f] bg-[#1a1a1d] shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              navigate("/perfil")
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm leading-5 text-[#edeef0] transition-colors hover:bg-white/6"
          >
            <UserCircle className="size-4 shrink-0 text-[#afb3ba]" strokeWidth={1.75} />
            Ir al perfil
          </button>
          <div className="mx-3 h-px bg-[#2a2b2f]" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm leading-5 text-[#f87171] transition-colors hover:bg-white/6"
          >
            <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  )
}
