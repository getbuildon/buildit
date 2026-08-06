"use client"

import Image from "next/image"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

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
              <p className="truncate text-[13px] font-semibold leading-[15.6px] text-white">
                BuildOn
              </p>
              <p className="truncate text-xs leading-[1.4] tracking-[-0.36px] text-[#777b84]">
                Administración
              </p>
            </div>
          </div>

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
