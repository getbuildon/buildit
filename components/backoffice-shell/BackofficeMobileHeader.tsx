"use client"

import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { BackofficeBrandLink } from "@/components/backoffice-shell/BackofficeBrandLink"
import { BackofficeNavLinks } from "@/components/backoffice-shell/BackofficeNavLinks"
import { BackofficeUserFooter } from "@/components/backoffice-shell/BackofficeUserFooter"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"

type BackofficeMobileHeaderProps = {
  userProfile: SidebarUserProfile
}

export function BackofficeMobileHeader({
  userProfile,
}: BackofficeMobileHeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  return (
    <>
      <header className="relative z-40 shrink-0 bg-[#111113] lg:hidden">
        <div
          className="flex h-14 items-center justify-between gap-3 border-b px-4"
          style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
        >
          <BackofficeBrandLink className="min-w-0 flex-1" />

          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-[#afb3ba] transition-colors hover:bg-white/6 hover:text-white"
            aria-expanded={menuOpen}
            aria-controls="backoffice-mobile-nav"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="size-5" strokeWidth={1.75} />
            ) : (
              <Menu className="size-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/40"
            onClick={closeMenu}
          />
          <div
            id="backoffice-mobile-nav"
            className="absolute inset-x-0 top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b bg-[#111113] px-3 pb-4 pt-2 shadow-[0_12px_32px_rgba(0,0,0,0.28)]"
            style={{ borderColor: BACKOFFICE_SHELL.sidebarBorder }}
          >
            <BackofficeNavLinks
              pathname={pathname}
              onNavigate={closeMenu}
              linkClassName="py-3"
            />
            <BackofficeUserFooter userProfile={userProfile} className="mt-2 px-0" />
          </div>
        </div>
      ) : null}
    </>
  )
}
