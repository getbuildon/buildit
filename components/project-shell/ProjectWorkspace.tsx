"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Bell, ChevronDown, LogOut } from "lucide-react"
import { BuiltItIsoIcon } from "@/components/brand/BuiltItIsoIcon"
import { useAuth } from "@/context/AuthContextSupabase"
import {
  PROJECT_ICON_GRADIENT,
  PROJECT_ICON_SHADOW,
  SIDEBAR_NAV_ACTIVE_LINK_STYLE,
  SIDEBAR_NAV_INACTIVE_LINK_STYLE,
  SHELL_COLORS,
  SHELL_LAYOUT,
  SHELL_TYPE,
  TOPBAR_BELL_BUTTON_STYLE,
  TOPBAR_HEADER_STYLE,
  TOPBAR_NOTIFICATION_DOT_STYLE,
  TOPBAR_USER_AVATAR_STYLE,
  TOPBAR_USER_BUTTON_STYLE,
} from "@/lib/project/designTokens"
import { isProjectNavActive, PROJECT_NAV_ITEMS } from "@/lib/project/navigation"
import { projectHref } from "@/lib/project/routes"
import type { UserProjectListItem } from "@/lib/projects/types"
import { userProfileFromEmail } from "@/lib/projects/mockProjects"
import { cn } from "@/lib/utils"

type ProjectSidebarProps = {
  project: UserProjectListItem
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logOut, user } = useAuth()
  const profile = userProfileFromEmail(user?.email)

  const handleLogout = async () => {
    await logOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <aside
      className="sticky top-0 flex h-screen shrink-0 flex-col border-r"
      style={{
        width: SHELL_LAYOUT.sidebarWidth,
        backgroundColor: SHELL_COLORS.sidebarBg,
        borderColor: SHELL_COLORS.sidebarBorder,
      }}
    >
      <div
        className="flex shrink-0 items-center gap-3 border-b"
        style={{
          height: SHELL_LAYOUT.sidebarBrandHeight,
          paddingLeft: SHELL_LAYOUT.sidebarBrandPadding,
          paddingRight: SHELL_LAYOUT.sidebarBrandPadding,
          borderColor: SHELL_COLORS.sidebarBorder,
        }}
      >
        <Link
          href="/home"
          className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
          style={{
            backgroundImage: PROJECT_ICON_GRADIENT,
            boxShadow: PROJECT_ICON_SHADOW,
          }}
          aria-label="Volver a mis obras"
        >
          <BuiltItIsoIcon className="size-5 text-white" />
        </Link>
        <div className="min-w-0">
          <p className={cn("truncate", SHELL_TYPE.orgName)} style={{ color: SHELL_COLORS.orgName }}>
            {project.organizationName}
          </p>
          <p
            className={cn("truncate", SHELL_TYPE.projectName)}
            style={{ color: SHELL_COLORS.projectName }}
          >
            {project.name}
          </p>
        </div>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto"
        style={{
          paddingLeft: SHELL_LAYOUT.navSectionPaddingX,
          paddingRight: SHELL_LAYOUT.navSectionPaddingX,
          paddingTop: SHELL_LAYOUT.navSectionPaddingTop,
        }}
      >
        {PROJECT_NAV_ITEMS.map((item) => {
          const href = projectHref(project.projectId, item.segment || undefined)
          const active = isProjectNavActive(pathname, project.projectId, item.segment)
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "text-[#94a3b8] transition-colors",
                !active && "hover:bg-white/6 hover:text-[#f1f5f9]",
              )}
              style={active ? SIDEBAR_NAV_ACTIVE_LINK_STYLE : SIDEBAR_NAV_INACTIVE_LINK_STYLE}
            >
              <Icon className="size-4 shrink-0" style={{ color: "currentColor" }} aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div
        className="shrink-0 border-t"
        style={{
          height: SHELL_LAYOUT.userFooterHeight,
          borderColor: SHELL_COLORS.sidebarBorder,
          padding: "12px",
        }}
      >
        <div
          className="flex h-14 items-center gap-3 rounded-[10px] px-3"
          style={{ backgroundColor: SHELL_COLORS.userCardBg }}
        >
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              SHELL_TYPE.avatarSidebar,
            )}
            style={{
              backgroundColor: SHELL_COLORS.avatarBg,
              color: SHELL_COLORS.avatarText,
            }}
          >
            {profile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate", SHELL_TYPE.userName)} style={{ color: SHELL_COLORS.userName }}>
              {profile.fullName}
            </p>
            <p className={cn("truncate", SHELL_TYPE.userRole)} style={{ color: SHELL_COLORS.userRole }}>
              {profile.role}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex size-4 shrink-0 items-center justify-center transition-opacity hover:opacity-70"
            style={{ color: SHELL_COLORS.userRole }}
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function ProjectHeader() {
  const { user } = useAuth()
  const profile = userProfileFromEmail(user?.email)

  return (
    <header className="sticky top-0 z-10 shrink-0" style={TOPBAR_HEADER_STYLE}>
      <button
        type="button"
        className="transition-colors hover:bg-[#f8fafc]"
        style={TOPBAR_BELL_BUTTON_STYLE}
        aria-label="Notificaciones"
      >
        <Bell className="size-5 shrink-0" aria-hidden />
        <span style={TOPBAR_NOTIFICATION_DOT_STYLE} />
      </button>

      <button
        type="button"
        className="transition-colors hover:bg-[#f8fafc]"
        style={TOPBAR_USER_BUTTON_STYLE}
      >
        <span style={TOPBAR_USER_AVATAR_STYLE}>{profile.initials}</span>
        {profile.fullName}
        <ChevronDown
          className="size-4 shrink-0"
          style={{ color: "#64748b" }}
          aria-hidden
        />
      </button>
    </header>
  )
}

type ProjectWorkspaceProps = {
  project: UserProjectListItem
  children: ReactNode
}

export function ProjectWorkspace({ project, children }: ProjectWorkspaceProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: SHELL_COLORS.mainBg }}>
      <ProjectSidebar project={project} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ProjectHeader />
        <main className="flex-1 overflow-y-auto">
          <div
            className="mx-auto w-full"
            style={{
              maxWidth: SHELL_LAYOUT.contentMaxWidth,
              padding: SHELL_LAYOUT.contentPadding,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
