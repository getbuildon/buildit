"use client"

import { useEffect, useRef, type RefObject } from "react"
import { useRouter } from "next/navigation"

import {
  ProfileMenuLogoutIcon,
  ProfileMenuProfileIcon,
} from "@/components/project-shell/ProjectProfileMenuIcons"
import { useProjectNavigation } from "@/components/project-shell/ProjectNavigationContext"
import { useAuth } from "@/context/AuthContextSupabase"
import { projectHref } from "@/lib/project/routes"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"

// Figma node 1157:3306 — Profile Menu (192×176)

type UserMenuDropdownProps = {
  onClose: () => void
  projectId: string
  userProfile: SidebarUserProfile
  anchorRef?: RefObject<HTMLElement | null>
}

export function UserMenuDropdown({
  onClose,
  projectId,
  userProfile,
  anchorRef,
}: UserMenuDropdownProps) {
  const router = useRouter()
  const { navigate } = useProjectNavigation()
  const { user, logOut } = useAuth()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }

    const id = setTimeout(() => document.addEventListener("mousedown", handleClick), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener("mousedown", handleClick)
    }
  }, [onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const handleLogout = async () => {
    onClose()
    await logOut()
    router.replace("/login")
    router.refresh()
  }

  const email = userProfile.email || user?.email || ""

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Menú de usuario"
      className={cn(
        "absolute right-0 bottom-full z-50 mb-2 w-[192px]",
        "overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white px-px pb-px pt-[5px]",
        "shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)]",
      )}
    >
      <div className="h-[53px] border-b border-[#f1f5f9] px-4 pb-px pt-2">
        <p className="h-5 truncate text-sm font-medium leading-5 tracking-[-0.1504px] text-[#314158]">
          {userProfile.fullName}
        </p>
        <p
          className="h-4 truncate text-xs leading-4 text-[#90a1b9]"
          title={email || undefined}
        >
          {email}
        </p>
      </div>

      <div className="flex h-[41px] items-start border-b border-[#f1f5f9] px-4 pb-px pt-[12.5px]">
        <span className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-[#f1f5f9] px-2 py-[2px] text-xs leading-4 text-[#45556c]">
          {userProfile.roleLabel}
        </span>
      </div>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose()
          navigate(projectHref(projectId, "perfil"))
        }}
        className={cn(
          "flex h-9 w-full items-center gap-2 px-4 text-left",
          "text-sm font-medium leading-5 tracking-[-0.1504px] text-[#314158]",
          "transition-colors duration-150 hover:bg-[#f8fafc]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#314158]/20",
        )}
      >
        <ProfileMenuProfileIcon />
        Mi Perfil
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={handleLogout}
        className={cn(
          "flex h-9 w-full items-center gap-2 px-4 text-left",
          "text-sm font-medium leading-5 tracking-[-0.1504px] text-[#e7000b]",
          "transition-colors duration-150 hover:bg-[#fff1f1]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e7000b]/20",
        )}
      >
        <ProfileMenuLogoutIcon />
        Cerrar sesión
      </button>
    </div>
  )
}
