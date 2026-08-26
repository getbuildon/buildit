"use client"

import { Suspense, use, useEffect, useState, type ReactNode } from "react"
import { PanelLeft } from "lucide-react"

import { BackofficeMobileHeader } from "@/components/backoffice-shell/BackofficeMobileHeader"
import { BackofficeNavigationProvider } from "@/components/backoffice-shell/BackofficeNavigationContext"
import { BackofficeSidebar } from "@/components/backoffice-shell/BackofficeSidebar"
import { BACKOFFICE_SHELL } from "@/lib/backoffice/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"

type BackofficeShellProps = {
  children: ReactNode
  userProfile: SidebarUserProfile
}

export function BackofficeShellFromPromise({
  userProfilePromise,
  children,
}: {
  userProfilePromise: Promise<SidebarUserProfile>
  children: ReactNode
}) {
  return (
    <BackofficeNavigationProvider>
      <BackofficeShellFrame userProfilePromise={userProfilePromise}>
        {children}
      </BackofficeShellFrame>
    </BackofficeNavigationProvider>
  )
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

function BackofficeShellFrame({
  userProfilePromise,
  children,
}: {
  userProfilePromise: Promise<SidebarUserProfile>
  children: ReactNode
}) {
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
      <Suspense
        fallback={
          <div
            className="hidden h-full w-[220px] shrink-0 lg:block"
            style={{ backgroundColor: BACKOFFICE_SHELL.sidebarBg }}
            aria-hidden
          />
        }
      >
        <BackofficeChrome
          userProfilePromise={userProfilePromise}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
      </Suspense>

      <main className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
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

function BackofficeChrome({
  userProfilePromise,
  sidebarOpen,
  onToggleSidebar,
}: {
  userProfilePromise: Promise<SidebarUserProfile>
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  const userProfile = use(userProfilePromise)

  return (
    <>
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
            onToggleSidebar={onToggleSidebar}
          />
        </div>
      </aside>
    </>
  )
}

function BackofficeShellContent({ children, userProfile }: BackofficeShellProps) {
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
