"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useProjectAccess } from "@/components/project-shell/ProjectAccessProvider"
import {
  matchesProjectNavHref,
  useProjectNavigation,
} from "@/components/project-shell/ProjectNavigationContext"
import { ProjectNavIcon } from "@/components/project-shell/ProjectNavIcons"
import {
  getAllowedProjectNavItems,
  isProjectNavActive,
} from "@/lib/project/navigation"
import { projectHref } from "@/lib/project/routes"
import { cn } from "@/lib/utils"

type ProjectNavLinksProps = {
  projectId: string
  onNavigate?: () => void
  className?: string
  linkClassName?: string
}

export function ProjectNavLinks({
  projectId,
  onNavigate,
  className,
  linkClassName,
}: ProjectNavLinksProps) {
  const pathname = usePathname()
  const { permissions } = useProjectAccess()
  const { navigate, pendingHref } = useProjectNavigation()
  const navItems = getAllowedProjectNavItems(permissions)

  return (
    <nav className={cn("flex flex-col", className)} style={{ gap: "4px" }}>
      {navItems.map((item) => {
        const href = projectHref(projectId, item.segment || undefined)
        const active = pendingHref
          ? matchesProjectNavHref(pendingHref, href)
          : isProjectNavActive(pathname, projectId, item.segment)

        return (
          <Link
            key={item.label}
            href={href}
            onClick={(event) => {
              if (active) {
                event.preventDefault()
                return
              }

              event.preventDefault()
              onNavigate?.()
              navigate(href)
            }}
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
              linkClassName,
            )}
            style={{
              minHeight: "40px",
              paddingLeft: "12px",
              paddingRight: "12px",
              gap: "12px",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "19.6px",
              textDecoration: "none",
            }}
          >
            <ProjectNavIcon id={item.icon} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
