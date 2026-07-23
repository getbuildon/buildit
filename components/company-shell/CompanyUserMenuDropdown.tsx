"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/context/AuthContextSupabase"
import { UserAvatar } from "@/components/user/UserAvatar"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"

type CompanyUserMenuDropdownProps = {
  onClose: () => void
  userProfile: SidebarUserProfile
}

export function CompanyUserMenuDropdown({
  onClose,
  userProfile,
}: CompanyUserMenuDropdownProps) {
  const router = useRouter()
  const { user, logOut } = useAuth()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const id = window.setTimeout(() => document.addEventListener("mousedown", handleClick), 0)
    return () => {
      window.clearTimeout(id)
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

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Menú de usuario"
      className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-[0_6px_6px_-4px_rgba(0,0,0,0.10),0_15px_15px_-3px_rgba(0,0,0,0.10)]"
      style={{ padding: "5px 1px 1px" }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-2">
        <div className="flex items-start gap-3">
          <UserAvatar
            firstName={userProfile.firstName}
            lastName={userProfile.lastName}
            email={userProfile.email}
            avatarUrl={userProfile.avatarUrl}
            size={31}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-[14px] font-medium leading-[1.4] text-[#314158]">
              {userProfile.fullName}
            </p>
            <p
              className="truncate text-[12px] leading-[1.4] text-[#90a1b9]"
              title={userProfile.email || user?.email || undefined}
            >
              {userProfile.email || user?.email}
            </p>
            <div className="mt-2.5">
              <span className="inline-block rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[12px] leading-[1.4] text-[#45556c]">
                {userProfile.roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="py-1">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose()
            router.push("/perfil")
          }}
          className="mx-1 flex w-[calc(100%-8px)] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-[#314158] transition-colors hover:bg-[#f1f5f9]"
        >
          <User className="size-4 shrink-0" strokeWidth={1.33} aria-hidden />
          Mi Perfil
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={handleLogout}
          className="mx-1 flex w-[calc(100%-8px)] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-[#e7000b] transition-colors hover:bg-[#fff1f1]"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.33} aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
