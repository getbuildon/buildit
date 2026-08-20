import Image from "next/image"
import type { ReactNode } from "react"
import {
  LOGIN_ACCENT,
  LOGIN_BG,
  LOGIN_COLORS,
  LOGIN_GRADIENT_LEFT,
  LOGIN_TYPE,
} from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"

import {
  AUTH_FORM_CARD_CLASSNAME,
  AUTH_FORM_SHELL_CLASSNAME,
} from "./authFormStyles"

type AuthHeroCopy = {
  title: string
  highlight?: string
  subtitle: string
}

type AuthSplitLayoutProps = {
  children: ReactNode
  belowCard?: ReactNode
  hero?: AuthHeroCopy
}

const DEFAULT_HERO: AuthHeroCopy = {
  title: "Seguimiento de obra claro, centralizado y en tiempo real.",
  highlight: "centralizado",
  subtitle:
    "Gestiona tus proyectos de construcción con total visibilidad. Monitorea avances, coordina equipos y mantén informados a tus clientes desde una sola plataforma.",
}

function renderHeroTitle(copy: AuthHeroCopy, accent: string, className: string) {
  if (!copy.highlight || !copy.title.includes(copy.highlight)) {
    return <h1 className={className}>{copy.title}</h1>
  }

  const [before, after] = copy.title.split(copy.highlight)
  return (
    <h1 className={className}>
      {before}
      <span style={{ color: accent }}>{copy.highlight}</span>
      {after}
    </h1>
  )
}

function AuthDesktopHero({ hero }: { hero: AuthHeroCopy }) {
  return (
    <section className="relative hidden min-h-dvh overflow-hidden lg:flex lg:flex-col">
      <div className="absolute inset-0">
        <Image
          src="/login/hero-bg.jpg"
          alt=""
          fill
          priority
          className="object-cover grayscale"
          sizes="(min-width: 1024px) 50vw, 0vw"
        />
      </div>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: LOGIN_GRADIENT_LEFT }}
      />

      <div className="relative flex min-h-dvh flex-col overflow-y-auto px-10 pb-12 pt-12 xl:px-16 xl:pb-16 xl:pt-16 2xl:px-20 2xl:pb-20 2xl:pt-20">
        <div className="flex flex-1 flex-col justify-center pr-4 xl:pr-16 2xl:pr-24">
          <Image
            src="/logo-build-on.svg"
            alt="BuildOn"
            width={200}
            height={42}
            priority
            className="mb-10 h-9 w-auto self-start xl:mb-16 xl:h-[42px]"
          />

          <div className="flex max-w-xl flex-col gap-4 xl:max-w-2xl xl:gap-6">
            {renderHeroTitle(
              hero,
              LOGIN_ACCENT,
              "font-recoleta text-[34px] font-normal leading-[1.08] text-[#fefcfb] xl:text-[52px] xl:leading-[1.06] 2xl:text-[64px] 2xl:leading-[67.2px]",
            )}
            <p
              className="max-w-lg text-base leading-relaxed tracking-[0.2px] xl:text-lg xl:leading-7 xl:tracking-[0.4px] 2xl:text-[20px] 2xl:leading-[28px]"
              style={{ color: LOGIN_COLORS.heroText }}
            >
              {hero.subtitle}
            </p>
          </div>
        </div>

        <p className={LOGIN_TYPE.heroFooter} style={{ color: LOGIN_COLORS.footer }}>
          Desarrollado por Elemental Haus
        </p>
      </div>
    </section>
  )
}

function AuthTabletIntro({ hero }: { hero: AuthHeroCopy }) {
  return (
    <div className="mb-6 hidden w-full text-center md:block lg:hidden">
      <Image
        src="/logo-build-on.svg"
        alt="BuildOn"
        width={180}
        height={38}
        className="mx-auto mb-5 h-9 w-auto"
      />
      <p className="font-recoleta text-[28px] leading-[1.12] text-white sm:text-[32px]">
        {hero.title}
      </p>
    </div>
  )
}

function AuthMobileLogo() {
  return (
    <Image
      src="/logo-build-on.svg"
      alt="BuildOn"
      width={180}
      height={38}
      className="mx-auto mb-5 h-9 w-auto md:hidden"
    />
  )
}

export function AuthSplitLayout({
  children,
  belowCard,
  hero = DEFAULT_HERO,
}: AuthSplitLayoutProps) {
  return (
    <div className="relative min-h-dvh" style={{ backgroundColor: LOGIN_BG }}>
      <main className="grid min-h-dvh lg:grid-cols-[minmax(0,902fr)_minmax(0,997fr)]">
        <AuthDesktopHero hero={hero} />

        <section className="relative flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto lg:min-h-0">
          <Image
            src="/login/circle-decoration.svg"
            alt=""
            width={931}
            height={1011}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[min(88vw,820px)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-90 lg:block"
          />

          <div className="relative mx-auto flex w-full flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 md:py-12 lg:py-12">
            <AuthTabletIntro hero={hero} />
            <AuthMobileLogo />

            <div className={AUTH_FORM_SHELL_CLASSNAME}>{children}</div>

            {belowCard ? (
              <div className={cn(AUTH_FORM_SHELL_CLASSNAME, "mt-4 sm:mt-5")}>
                {belowCard}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}

type AuthFormCardProps = {
  children: ReactNode
  className?: string
}

export function AuthFormCard({ children, className }: AuthFormCardProps) {
  return (
    <div
      className={cn(
        AUTH_FORM_SHELL_CLASSNAME,
        AUTH_FORM_CARD_CLASSNAME,
        "px-6 py-10 sm:px-7 sm:py-11 md:px-8 md:py-12 lg:px-8 lg:py-14",
        className,
      )}
      style={{ borderColor: LOGIN_COLORS.inputBorder }}
    >
      <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">{children}</div>
    </div>
  )
}
