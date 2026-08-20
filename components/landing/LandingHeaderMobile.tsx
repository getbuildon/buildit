"use client"

import Image from "next/image"
import Link from "next/link"
import { CircleUserRound, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"

import { useLandingActions } from "@/components/landing/LandingActionsProvider"
import {
  AnimatedCollapsible,
  ANIMATED_COLLAPSE_DURATION_MS,
} from "@/components/ui/animated-collapsible"
import { handleLandingNavClick } from "@/lib/landing/handleLandingNavClick"
import { LANDING_HEADER_NAV_LINKS } from "@/lib/landing/headerNavLinks"
import { LANDING_LOGIN_MENU_ITEMS } from "@/lib/landing/loginMenuItems"
import { cn } from "@/lib/utils"

export function LandingHeaderMobile() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { openContactModal, scrollToPlans } = useLandingActions()

  const closeMenu = () => setMenuOpen(false)

  const handleSolicitarDemo = () => {
    closeMenu()
    openContactModal()
  }

  const handleVerPlanes = () => {
    closeMenu()
    scrollToPlans()
  }

  useEffect(() => {
    if (!menuOpen) return

    const closeOnScroll = () => setMenuOpen(false)

    window.addEventListener("scroll", closeOnScroll, {
      passive: true,
      capture: true,
    })
    window.addEventListener("wheel", closeOnScroll, { passive: true })
    window.addEventListener("touchmove", closeOnScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", closeOnScroll, { capture: true })
      window.removeEventListener("wheel", closeOnScroll)
      window.removeEventListener("touchmove", closeOnScroll)
    }
  }, [menuOpen])

  return (
    <div className="relative">
      <div className="flex h-[80px] items-center justify-between px-6">
        <Link
          href="/"
          className="shrink-0"
          onClick={closeMenu}
          aria-label="BuildOn — inicio"
        >
          <Image
            src="/landing/logo-build-on.svg"
            alt="BuildOn"
            width={120}
            height={25}
            priority
            className="h-[25px] w-[120px]"
          />
        </Link>

        <button
          type="button"
          className="flex size-10 items-center justify-center"
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-nav"
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

      <AnimatedCollapsible
        open={menuOpen}
        className="absolute inset-x-0 top-full z-50"
        contentClassName="overflow-hidden"
      >
        <div
          id="landing-mobile-nav"
          className={cn(
            "flex flex-col gap-6 border-b border-[#eef0f2] bg-[#e2e0df] px-6 pb-[41px] pt-6 transition-[opacity,transform] ease-in-out",
            menuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0",
          )}
          style={{
            transitionDuration: `${ANIMATED_COLLAPSE_DURATION_MS}ms`,
          }}
        >
          <nav className="flex flex-col">
            {LANDING_HEADER_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-[#edeef0] py-4 text-lg leading-[1.2] tracking-[0.36px] text-[#363a3f]"
                onClick={(event) =>
                  handleLandingNavClick(event, link.sectionId, closeMenu)
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col rounded-[10px] bg-[#fff6f1] p-2">
              <p className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium leading-[1.4] text-[#272a2d]">
                <CircleUserRound className="size-4" strokeWidth={1.75} aria-hidden />
                Iniciar sesión
              </p>
              {LANDING_LOGIN_MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[10px] p-2 text-left text-sm leading-[1.4] text-[#111113] transition-colors hover:bg-[#ffeae0]"
                  onClick={closeMenu}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="whitespace-nowrap font-normal">{item.description}</p>
                </Link>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-[10px] bg-[#edeef0] px-4 py-2.5 text-sm font-medium leading-[1.4] text-[#272a2d]"
                onClick={handleSolicitarDemo}
              >
                Solicitar demo
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-[10px] bg-[#272a2d] px-5 py-2.5 text-sm font-medium leading-[1.4] text-white"
                onClick={handleVerPlanes}
              >
                Ver planes
              </button>
            </div>
          </div>
        </div>
      </AnimatedCollapsible>
    </div>
  )
}
