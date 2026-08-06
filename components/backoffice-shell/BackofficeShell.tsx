"use client"

import { useEffect, useState, type ReactNode } from "react"
import { PanelLeft } from "lucide-react"

import { BackofficeMobileHeader } from "@/components/backoffice-shell/BackofficeMobileHeader"
import {
  BackofficeNavigationProvider,
  useBackofficeNavigation,
} from "@/components/backoffice-shell/BackofficeNavigationContext"
import { BackofficeSidebar } from "@/components/backoffice-shell/BackofficeSidebar"
import { Spinner } from "@/components/ui/spinner"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"

type BackofficeShellProps = {
  children: ReactNode
  userProfile: SidebarUserProfile
}

export function BackofficeShell({ children, userProfile }: BackofficeShellProps) {
  return (
    <BackofficeNavigationProvider>
      <BackofficeShellContent userProfile={userProfile}>
        {children}
      </BackofficeShellContent>
    </BackofficeNavigationProvider>
  )
}

function BackofficeShellContent({ children, userProfile }: BackofficeShellProps) {
  const { isNavigating } = useBackofficeNavigation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow

    html.style.overflow = "hidden"
    body.style.overflow = "hidden"

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current)
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden lg:flex-row"
      style={{ backgroundColor: BACKOFFICE_SHELL.mainBg }}
      data-backoffice-shell
    >
      <BackofficeMobileHeader userProfile={userProfile} />

      <aside
        className={cn(
          "hidden h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out lg:flex",
          sidebarOpen ? "w-[220px]" : "w-0",
        )}
        aria-hidden={!sidebarOpen}
      >
        <div className="h-full min-h-0 w-[220px]">
          <BackofficeSidebar
            userProfile={userProfile}
            onToggleSidebar={toggleSidebar}
          />
        </div>
      </aside>

      <main className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
        {isNavigating ? (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#fefcfb]/70"
            aria-live="polite"
            aria-busy="true"
          >
            <Spinner className="size-8 text-[#ff7433]" />
          </div>
        ) : null}
        {!sidebarOpen ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="fixed left-4 top-4 z-30 hidden size-9 items-center justify-center rounded-lg border border-[#edeef0] bg-white text-[#43484e] shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-colors hover:bg-[#f4f5f6] hover:text-[#272a2d] lg:flex"
            aria-label="Mostrar menú"
          >
            <PanelLeft className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
        {children}
      </main>
    </div>
  )
}
