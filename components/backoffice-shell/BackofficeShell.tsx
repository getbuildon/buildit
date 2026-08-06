"use client"

import type { ReactNode } from "react"

import { BackofficeSidebar } from "@/components/backoffice-shell/BackofficeSidebar"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"

type BackofficeShellProps = {
  children: ReactNode
  userProfile: SidebarUserProfile
}

export function BackofficeShell({ children, userProfile }: BackofficeShellProps) {
  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: BACKOFFICE_SHELL.mainBg }}
      data-backoffice-shell
    >
      <BackofficeSidebar userProfile={userProfile} />
      <main className="min-h-screen min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
