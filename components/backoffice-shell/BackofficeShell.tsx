"use client"

import { useState, type ReactNode } from "react"
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

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current)
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: BACKOFFICE_SHELL.mainBg }}
      data-backoffice-shell
    >
      <aside
        className={cn(
          "h-screen shrink-0 overflow-hidden transition-[width] duration-200 ease-out",
          sidebarOpen ? "w-[220px]" : "w-0",
        )}
        aria-hidden={!sidebarOpen}
      >
        <div className="w-[220px]">
          <BackofficeSidebar
            userProfile={userProfile}
            onToggleSidebar={toggleSidebar}
          />
        </div>
      </aside>

      <main className="relative min-h-screen min-w-0 flex-1 overflow-y-auto">
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
