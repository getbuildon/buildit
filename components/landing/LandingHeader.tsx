"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useEffect, useState } from "react"

import { useLandingActions } from "@/components/landing/LandingActionsProvider"
import {
  AnimatedCollapsible,
  ANIMATED_COLLAPSE_DURATION_MS,
} from "@/components/ui/animated-collapsible"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#soluciones", label: "Soluciones" },
  { href: "#planes", label: "Planes" },
  { href: "#faq", label: "Preguntas frecuentes" },
] as const

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { openContactModal, scrollToPlans } = useLandingActions()

  const closeMenu = () => setMenuOpen(false)

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    closeMenu()

    if (href === "#planes") {
      event.preventDefault()
      scrollToPlans()
    }
  }

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
    <header className="sticky top-0 z-50 bg-background">
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
              "flex flex-col gap-6 border-b border-[#eef0f2] bg-background px-6 pb-[41px] pt-6 transition-[opacity,transform] ease-in-out",
              menuOpen
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0",
            )}
            style={{
              transitionDuration: `${ANIMATED_COLLAPSE_DURATION_MS}ms`,
            }}
          >
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-[#edeef0] py-4 text-lg leading-[1.2] tracking-[0.36px] text-[#363a3f]"
                  onClick={(event) => handleNavClick(event, link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-1 rounded-[10px] bg-[#fff6f1] py-2.5 text-lg leading-[1.2] tracking-[0.36px] text-[#272a2d]"
                onClick={closeMenu}
              >
                <Image
                  src="/landing/user-icon.svg"
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden
                  className="size-6"
                />
                Iniciar sesión
              </Link>

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
    </header>
  )
}
