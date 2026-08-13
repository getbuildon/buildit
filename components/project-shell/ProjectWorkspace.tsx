"use client"

import { type ReactNode, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { BuiltItIsoIcon } from "@/components/brand/BuiltItIsoIcon"
import { ProjectNavLinks } from "@/components/project-shell/ProjectNavLinks"
import { useProjectNavigation } from "@/components/project-shell/ProjectNavigationContext"
import { SidebarSwitchProjectButton } from "@/components/project-shell/SidebarSwitchProjectButton"
import { Spinner } from "@/components/ui/spinner"
import { SHELL_COLORS, SHELL_LAYOUT } from "@/lib/project/designTokens"
import type { UserProjectListItem } from "@/lib/projects/types"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/user/UserAvatar"
import { UserMenuDropdown } from "./UserMenuDropdown"
import { ProjectMobileHeader } from "./ProjectMobileHeader"

// Figma node 1157:2701 — exact specs
// Sidebar: bg=#fefcfb, radius=24, border=#dadada w=1, shadow: blur=39.2 spread=3.9 a=0.08
// Padding: 16px all sides, inner gap=11.8
// Brand header: height=76, gap=12, brand icon 36x36 radius=10 bg=#ff7433
// Org name: 14px w=600 color=#000000 Google Sans Flex
// Project name: 12px w=400 color=#000000 Google Sans Flex
// Switch button: 24x24 bg=#edeef0 radius=8 padding=4
// Nav area: padding H=12, T=16, gap=4
// Nav item: 230x40 radius=10 padding H=12 V=10 gap=12
// Active: bg=#18191b text=#ffffff 14px w=400
// Inactive: text=#111113 14px w=400
// Icon: 16x16
// User footer: padding H=12 T=17, border-top=#dadada w=1
// User card: bg=#f9f9fb radius=10 padding=12 gap=12 height=55.5
// Avatar: 31x31 radius=full
// Name: 14px w=600 color=#000000 | Role: 12px w=400 color=#000000
// Chevron button: 24x24 bg=#edeef0 radius=8

type ProjectSidebarProps = {
  project: UserProjectListItem
  userProfile: SidebarUserProfile
}

export function ProjectSidebar({ project, userProfile }: ProjectSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const userMenuAnchorRef = useRef<HTMLDivElement>(null)

  return (
    <aside
      className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden"
      style={{
        width: "254px",
        backgroundColor: "#fefcfb",
        borderRadius: "24px",
        boxShadow: "0 0 39px 4px rgba(0,0,0,0.08)",
      }}
    >
      {/* Brand header — Figma 1157:2703 */}
      <div
        className="flex shrink-0 items-center justify-between border-b"
        style={{
          padding: "16px",
          borderColor: "#dadada",
        }}
      >
        <div className="flex min-w-0 items-center" style={{ gap: "12px" }}>
          {/* Brand icon — 36x36 orange rounded square */}
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "#ff7433",
            }}
          >
            <BuiltItIsoIcon className="size-5 text-white" />
          </div>

          {/* Org + project name */}
          <div className="min-w-0 flex-1" style={{ gap: "0px" }}>
            <p
              className="truncate"
              style={{ fontSize: "14px", fontWeight: 600, lineHeight: "19.6px", color: "#000000" }}
            >
              {project.organizationName || "Organización"}
            </p>
            <p
              className="truncate"
              style={{ fontSize: "12px", fontWeight: 400, lineHeight: "16.8px", color: "#000000" }}
            >
              {project.name}
            </p>
          </div>
        </div>

        <SidebarSwitchProjectButton />
      </div>

      {/* Nav */}
      <div
        className="flex flex-1 flex-col overflow-y-auto"
        style={{ padding: "16px 12px 12px" }}
      >
        <ProjectNavLinks projectId={project.projectId} />
      </div>

      {/* User footer */}
      <div
        className="relative z-10 shrink-0 overflow-visible border-t"
        style={{ padding: "17px 12px 16px", borderColor: "#dadada" }}
      >
        {/* User card: bg=#f9f9fb, radius=10, padding=12, gap=12 */}
        <div
          className="flex items-center"
          style={{
            backgroundColor: "#f9f9fb",
            borderRadius: "10px",
            padding: "12px",
            gap: "12px",
          }}
        >
          <UserAvatar
            firstName={userProfile.firstName}
            lastName={userProfile.lastName}
            email={userProfile.email}
            avatarUrl={userProfile.avatarUrl}
            size="sidebar"
          />

          {/* Name + role */}
          <div className="min-w-0 flex-1">
            <p
              className="truncate"
              style={{ fontSize: "14px", fontWeight: 600, lineHeight: "19.6px", color: "#000000" }}
            >
              {userProfile.fullName}
            </p>
            <p
              className="truncate"
              style={{ fontSize: "12px", fontWeight: 400, lineHeight: "16.8px", color: "#000000" }}
            >
              {userProfile.roleLabel}
            </p>
          </div>

          {/* Chevron + profile menu */}
          <div ref={userMenuAnchorRef} className="relative shrink-0">
            {menuOpen ? (
              <UserMenuDropdown
                onClose={() => setMenuOpen(false)}
                projectId={project.projectId}
                userProfile={userProfile}
                anchorRef={userMenuAnchorRef}
              />
            ) : null}

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menú de usuario"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={cn(
                "flex shrink-0 items-center justify-center",
                "rounded-[8px] transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18191b]/20 focus-visible:ring-offset-1",
                "active:scale-95",
                menuOpen
                  ? "bg-[#18191b] text-white"
                  : "bg-[#edeef0] text-[#272a2d] hover:bg-[#d8d9db] active:bg-[#c8c9cb]",
              )}
              style={{ width: "24px", height: "24px" }}
            >
              <ChevronDown
                aria-hidden
                style={{
                  width: "14px",
                  height: "14px",
                  transition: "transform 0.2s ease",
                  transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

type ProjectWorkspaceProps = {
  project: UserProjectListItem
  userProfile: SidebarUserProfile
  children: ReactNode
}

export function ProjectWorkspace({ project, userProfile, children }: ProjectWorkspaceProps) {
  const { isNavigating } = useProjectNavigation()

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:flex-row"
      style={{ backgroundColor: SHELL_COLORS.mainBg }}
    >
      <ProjectMobileHeader project={project} userProfile={userProfile} />

      <div
        className="box-border hidden h-full min-h-0 shrink-0 flex-col py-3 pl-3 lg:flex"
        style={{ width: `calc(${SHELL_LAYOUT.sidebarWidth} + ${SHELL_LAYOUT.sidebarMargin})` }}
      >
        <ProjectSidebar project={project} userProfile={userProfile} />
      </div>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
          {isNavigating ? (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#fefcfb]/70"
              aria-live="polite"
              aria-busy="true"
            >
              <Spinner className="size-8 text-[#ff7433]" />
            </div>
          ) : null}
          <div
            className="mx-auto flex w-full flex-col px-4 pb-4 pt-4 lg:px-6 lg:pb-6 lg:pt-6"
            style={{
              maxWidth: SHELL_LAYOUT.contentMaxWidth,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
