"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#soluciones", label: "Soluciones" },
  { href: "#planes", label: "Planes" },
  { href: "#faq", label: "Preguntas frecuentes" },
] as const

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className={cn(
        "bg-background",
        menuOpen && "border-b border-[#eef0f2] pb-[41px]",
      )}
    >
      <div className="px-6">
        <div className="flex h-[80px] items-center justify-between">
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

        {menuOpen ? (
          <div id="landing-mobile-nav" className="mt-[24px] flex flex-col gap-6">
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-[#edeef0] py-4 text-lg leading-[1.2] tracking-[0.36px] text-[#363a3f]"
                  onClick={closeMenu}
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
                <Link
                  href="#demo"
                  className="flex flex-1 items-center justify-center rounded-[10px] bg-[#edeef0] px-4 py-2.5 text-sm font-medium leading-[1.4] text-[#272a2d]"
                  onClick={closeMenu}
                >
                  Solicitar demo
                </Link>
                <Link
                  href="#planes"
                  className="flex flex-1 items-center justify-center rounded-[10px] bg-[#272a2d] px-5 py-2.5 text-sm font-medium leading-[1.4] text-white"
                  onClick={closeMenu}
                >
                  Ver planes
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
