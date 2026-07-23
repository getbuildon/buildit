"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useState } from "react"
import { ArrowLeftRight, ChevronDown } from "lucide-react"
import { BuiltItIsoIcon } from "@/components/brand/BuiltItIsoIcon"
import { UserAvatar } from "@/components/user/UserAvatar"
import type { CompanyData } from "@/lib/company/getCompanies"
import {
  COMPANY_NAV_ITEMS,
  companyHref,
  isCompanyNavActive,
} from "@/lib/company/navigation"
import { SHELL_COLORS, SHELL_LAYOUT } from "@/lib/project/designTokens"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"
import { CompanyUserMenuDropdown } from "./CompanyUserMenuDropdown"

type CompanySidebarProps = {
  company: CompanyData
  userProfile: SidebarUserProfile
}

function CompanySidebar({ company, userProfile }: CompanySidebarProps) {
  const pathname = usePathname()
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
      <div
        className="flex shrink-0 items-center border-b"
        style={{ padding: "16px", gap: "12px", borderColor: "#dadada" }}
      >
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

        <div className="min-w-0 flex-1">
          <p
            className="truncate"
            style={{ fontSize: "14px", fontWeight: 600, lineHeight: "19.6px", color: "#000000" }}
          >
            {company.name}
          </p>
        </div>

        <Link
          href="/home"
          aria-label="Volver al inicio"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[8px] bg-[#edeef0] p-1 text-[#afb3ba]",
            "transition-all duration-150 hover:bg-[#d8d9db] hover:text-[#696e77] active:scale-95",
          )}
          style={{ width: "24px", height: "24px" }}
        >
          <ArrowLeftRight className="size-4" strokeWidth={1} aria-hidden />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto" style={{ padding: "16px 12px 12px", gap: "4px" }}>
        {COMPANY_NAV_ITEMS.map((item) => {
          const href = companyHref(company.id, item.segment)
          const active = isCompanyNavActive(pathname, company.id, item.segment)
          const Icon = item.icon

          return (
            <Link
              key={item.segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center rounded-[10px] transition-all duration-150",
                active
                  ? "bg-[#18191b] text-white"
                  : "text-[#111113] hover:bg-[#f0f0f2] hover:text-[#000000] active:scale-[0.99]",
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
              <Icon className="size-4 shrink-0" strokeWidth={1.32} aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="relative shrink-0 border-t" style={{ padding: "17px 12px 16px", borderColor: "#dadada" }}>
        {menuOpen ? (
          <CompanyUserMenuDropdown
            onClose={() => setMenuOpen(false)}
            userProfile={userProfile}
          />
        ) : null}

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

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Menú de usuario"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-[8px] transition-all duration-150 active:scale-95",
              menuOpen
                ? "bg-[#18191b] text-white"
                : "bg-[#edeef0] text-[#272a2d] hover:bg-[#d8d9db]",
            )}
            style={{ width: "24px", height: "24px" }}
          >
            <ChevronDown
              className="size-3.5 transition-transform duration-200"
              style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </aside>
  )
}

type CompanyWorkspaceProps = {
  company: CompanyData
  userProfile: SidebarUserProfile
  children: ReactNode
}

export function CompanyWorkspace({ company, userProfile, children }: CompanyWorkspaceProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: SHELL_COLORS.mainBg }}>
      <CompanySidebar company={company} userProfile={userProfile} />
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
