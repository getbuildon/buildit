"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useEffect, useState } from "react"

import { BuiltItIsoIcon } from "@/components/brand/BuiltItIsoIcon"
import {
  ProfileMenuLogoutIcon,
  ProfileMenuProfileIcon,
} from "@/components/project-shell/ProjectProfileMenuIcons"
import { ProjectNavLinks } from "@/components/project-shell/ProjectNavLinks"
import { SidebarSwitchProjectButton } from "@/components/project-shell/SidebarSwitchProjectButton"
import { useAppRouteNavigation } from "@/components/navigation/AppRouteLoadingProvider"
import { UserAvatar } from "@/components/user/UserAvatar"
import {
  AnimatedCollapsible,
  ANIMATED_COLLAPSE_DURATION_MS,
} from "@/components/ui/animated-collapsible"
import { useAuth } from "@/context/AuthContextSupabase"
import { projectHref } from "@/lib/project/routes"
import type { UserProjectListItem } from "@/lib/projects/types"
import type { SidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import { cn } from "@/lib/utils"

type ProjectMobileHeaderProps = {
  project: UserProjectListItem
  userProfile: SidebarUserProfile
}

export function ProjectMobileHeader({
  project,
  userProfile,
}: ProjectMobileHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { navigate } = useAppRouteNavigation()
  const { logOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const perfilHref = projectHref(project.projectId, "perfil")

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const main = document.querySelector("[data-project-shell] main")
    if (!main) return

    const onScroll = () => {
      setIsScrolled(main.scrollTop > 8)
    }

    onScroll()
    main.addEventListener("scroll", onScroll, { passive: true })

    return () => main.removeEventListener("scroll", onScroll)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const closeOnScroll = () => setMenuOpen(false)
    const main = document.querySelector("[data-project-shell] main")

    window.addEventListener("scroll", closeOnScroll, {
      passive: true,
      capture: true,
    })
    window.addEventListener("wheel", closeOnScroll, { passive: true })
    window.addEventListener("touchmove", closeOnScroll, { passive: true })
    main?.addEventListener("scroll", closeOnScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", closeOnScroll, { capture: true })
      window.removeEventListener("wheel", closeOnScroll)
      window.removeEventListener("touchmove", closeOnScroll)
      main?.removeEventListener("scroll", closeOnScroll)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    closeMenu()
    await logOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div
      className={cn(
        "relative z-40 shrink-0 bg-white transition-shadow duration-200 lg:hidden",
        isScrolled && "shadow-[0_4px_16px_rgba(24,25,27,0.08)]",
      )}
    >
      <div className="flex h-[80px] items-center justify-between gap-3 px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#ff7433]"
            aria-hidden
          >
            <BuiltItIsoIcon className="size-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-[18.2px] text-black">
              {project.organizationName || "Organización"}
            </p>
            <p className="truncate text-xs leading-[16.8px] tracking-[-0.36px] text-black">
              {project.name}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SidebarSwitchProjectButton />
          <button
            type="button"
            className="flex size-10 items-center justify-center"
            aria-expanded={menuOpen}
            aria-controls="project-mobile-nav"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="size-6 text-[#272a2d]" strokeWidth={2} />
            ) : (
              <Menu className="size-6 text-[#272a2d]" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      <AnimatedCollapsible
        open={menuOpen}
        className="absolute inset-x-0 top-full z-50"
        contentClassName="overflow-hidden"
      >
        <div
          id="project-mobile-nav"
          className={cn(
            "flex max-h-[calc(100dvh-5rem)] flex-col overflow-y-auto border-b border-[#eef0f2] bg-white px-6 pb-6 pt-4 transition-[opacity,transform] ease-in-out",
            menuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0",
          )}
          style={{
            transitionDuration: `${ANIMATED_COLLAPSE_DURATION_MS}ms`,
          }}
        >
          <ProjectNavLinks
            projectId={project.projectId}
            onNavigate={closeMenu}
            linkClassName="py-2.5"
          />

          <div className="mt-4 border-t border-[#edeef0] pt-4">
            <div className="mb-3 flex items-center gap-3 rounded-[10px] bg-[#f9f9fb] p-3">
              <UserAvatar
                firstName={userProfile.firstName}
                lastName={userProfile.lastName}
                email={userProfile.email}
                avatarUrl={userProfile.avatarUrl}
                size="sidebar"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-[19.6px] text-black">
                  {userProfile.fullName}
                </p>
                <p className="truncate text-xs leading-[16.8px] text-black">
                  {userProfile.roleLabel}
                </p>
              </div>
            </div>

            <Link
              href={perfilHref}
              onClick={(event) => {
                event.preventDefault()
                closeMenu()
                navigate(perfilHref)
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-[#314158]",
                "transition-colors hover:bg-[#f0f0f2] active:bg-[#e4e4e6]",
              )}
            >
              <ProfileMenuProfileIcon />
              Mi Perfil
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "mt-1 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-[#e7000b]",
                "transition-colors hover:bg-[#fff1f1] active:bg-[#ffe4e4]",
              )}
            >
              <ProfileMenuLogoutIcon />
              Cerrar sesión
            </button>
          </div>
        </div>
      </AnimatedCollapsible>
    </div>
  )
}
