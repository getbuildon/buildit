"use client"

import { useEffect, useState, type ReactNode } from "react"
import { PanelLeft, PanelLeftClose } from "lucide-react"

import { BackofficeSidebar } from "@/components/backoffice-shell/BackofficeSidebar"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"

type BackofficeShellProps = {
  children: ReactNode
  userProfile: SidebarUserProfile
}

export function BackofficeShell({ children, userProfile }: BackofficeShellProps) {
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
      className="fixed inset-0 flex overflow-hidden"
      style={{ backgroundColor: BACKOFFICE_SHELL.mainBg }}
      data-backoffice-shell
    >
      <aside
        className={cn(
          "flex h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out",
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
        {!sidebarOpen ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="fixed left-4 top-4 z-30 flex size-9 items-center justify-center rounded-lg border border-[#edeef0] bg-white text-[#43484e] shadow-[0_0_5px_rgba(243,103,31,0.08)] transition-colors hover:bg-[#f4f5f6] hover:text-[#272a2d]"
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
