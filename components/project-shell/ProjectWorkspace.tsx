"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useState } from "react"
import { ArrowLeftRight, ChevronDown } from "lucide-react"
import { BuiltItIsoIcon } from "@/components/brand/BuiltItIsoIcon"
import { useAuth } from "@/context/AuthContextSupabase"
import { SHELL_COLORS, SHELL_LAYOUT } from "@/lib/project/designTokens"
import { isProjectNavActive, PROJECT_NAV_ITEMS } from "@/lib/project/navigation"
import { projectHref } from "@/lib/project/routes"
import type { UserProjectListItem } from "@/lib/projects/types"
import { userProfileFromEmail } from "@/lib/projects/mockProjects"
import { cn } from "@/lib/utils"
import { UserMenuDropdown } from "./UserMenuDropdown"

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
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const profile = userProfileFromEmail(user?.email)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <aside
      className="sticky top-3 my-3 ml-3 flex shrink-0 flex-col overflow-hidden"
      style={{
        width: "254px",
        height: "calc(100vh - 24px)",
        backgroundColor: "#fefcfb",
        borderRadius: "24px",
        boxShadow: "0 0 39px 4px rgba(0,0,0,0.08)",
      }}
    >
      {/* Brand header */}
      <div
        className="flex shrink-0 items-center border-b"
        style={{
          padding: "16px",
          gap: "12px",
          borderColor: "#dadada",
        }}
      >
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

        {/* Switch project button — 24x24 gray square */}
        <Link
          href="/home"
          aria-label="Cambiar de obra"
          className={cn(
            "flex shrink-0 items-center justify-center",
            "rounded-[8px] bg-[#edeef0] text-[#afb3ba]",
            "transition-all duration-150",
            "hover:bg-[#d8d9db] hover:text-[#696e77]",
            "active:scale-95 active:bg-[#c8c9cb]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18191b]/20 focus-visible:ring-offset-1",
          )}
          style={{ width: "24px", height: "24px", padding: "4px" }}
        >
          {/* lucide/arrow-right-left — Figma: 16x16, stroke=#afb3ba w=1 */}
          <ArrowLeftRight
            aria-hidden
            style={{ width: "16px", height: "16px", color: "currentColor", strokeWidth: 1 }}
          />
        </Link>
      </div>

      {/* Nav */}
      <nav
        className="flex flex-1 flex-col overflow-y-auto"
        style={{ padding: "16px 12px 12px", gap: "4px" }}
      >
        {PROJECT_NAV_ITEMS.map((item) => {
          const href = projectHref(project.projectId, item.segment || undefined)
          const active = isProjectNavActive(pathname, project.projectId, item.segment)
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center rounded-[10px] transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18191b]/20 focus-visible:ring-offset-1",
                active
                  ? "bg-[#18191b] text-white"
                  : cn(
                      "text-[#111113]",
                      "hover:bg-[#f0f0f2] hover:text-[#000000]",
                      "active:bg-[#e4e4e6] active:scale-[0.99]",
                    ),
              )}
              style={{
                height: "40px",
                paddingLeft: "12px",
                paddingRight: "12px",
                gap: "12px",
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: "19.6px",
                textDecoration: "none",
              }}
            >
              <Icon
                aria-hidden
                style={{
                  width: "16px",
                  height: "16px",
                  flexShrink: 0,
                  color: "currentColor",
                  strokeWidth: 1.32,
                }}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div
        className="relative shrink-0 border-t"
        style={{ padding: "17px 12px 16px", borderColor: "#dadada" }}
      >
        {menuOpen && <UserMenuDropdown onClose={() => setMenuOpen(false)} projectId={project.projectId} />}

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
          {/* Avatar: 31x31 orange circle with initials */}
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{
              width: "31px",
              height: "31px",
              backgroundColor: "#ff7433",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {profile.initials}
          </div>

          {/* Name + role */}
          <div className="min-w-0 flex-1">
            <p
              className="truncate"
              style={{ fontSize: "14px", fontWeight: 600, lineHeight: "19.6px", color: "#000000" }}
            >
              {profile.fullName}
            </p>
            <p
              className="truncate"
              style={{ fontSize: "12px", fontWeight: 400, lineHeight: "16.8px", color: "#000000" }}
            >
              {profile.role}
            </p>
          </div>

          {/* Chevron button: 24x24 gray — states: default, hover, pressed, open */}
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
    </aside>
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
        <main className="flex-1">
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
