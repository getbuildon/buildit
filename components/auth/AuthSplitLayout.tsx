import Image from "next/image"
import type { ReactNode } from "react"
import {
  LOGIN_BG,
  LOGIN_CARD,
  LOGIN_COLORS,
  LOGIN_GRADIENT_LEFT,
  LOGIN_TYPE,
} from "@/lib/login/designTokens"
import { cn } from "@/lib/utils"

type AuthSplitLayoutProps = {
  children: ReactNode
  belowCard?: ReactNode
}

export function AuthSplitLayout({ children, belowCard }: AuthSplitLayoutProps) {
  return (
    <div
      className="relative min-h-screen"
      style={{ backgroundColor: LOGIN_BG }}
    >
      <main className="grid min-h-screen lg:grid-cols-[902fr_997fr]">
        <section
          className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col"
        >
          <div className="absolute inset-0">
            <Image
              src="/login/hero-bg.jpg"
              alt=""
              fill
              priority
              className="object-cover grayscale"
              sizes="50vw"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: LOGIN_GRADIENT_LEFT }}
          />

          <div className="relative flex min-h-screen flex-col">
            <div className="flex flex-1 flex-col justify-center pl-20 pr-[200px] pt-20">
              <div className="w-full">
                <Image
                  src="/logo-build-on.svg"
                  alt="BuildOn"
                  width={200}
                  height={42}
                  priority
                  className="mb-20 h-[42px] w-auto self-start"
                />

                <div className="flex flex-col gap-6">
                  <h1
                    className={LOGIN_TYPE.heroTitle}
                    style={{ color: LOGIN_COLORS.heroText }}
                  >
                    Seguimiento de obra claro,{" "}
                    <span style={{ color: "#FF7433" }}>centralizado</span> y en
                    tiempo real.
                  </h1>
                  <p
                    className={cn(LOGIN_TYPE.heroBody)}
                    style={{ color: LOGIN_COLORS.heroText }}
                  >
                    Gestiona tus proyectos de construcción con total visibilidad.
                    Monitorea avances, coordina equipos y mantén informados a tus
                    clientes desde una sola plataforma.
                  </p>
                </div>
              </div>
            </div>

            <p
              className={cn("pb-20 pl-20", LOGIN_TYPE.heroFooter)}
              style={{ color: LOGIN_COLORS.footer }}
            >
              Desarrollado por Elemental Haus
            </p>
          </div>
        </section>

        <section
          className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20"
        >
          <div
            className="flex w-full flex-col items-center"
            style={{ maxWidth: LOGIN_CARD.maxWidth }}
          >
            <Image
              src="/logo-build-on.svg"
              alt="BuildOn"
              width={200}
              height={42}
              className="mb-6 h-[42px] w-auto self-start lg:hidden"
            />

            {children}

            {belowCard ? <div className="mt-5 w-full">{belowCard}</div> : null}
          </div>
        </section>
      </main>
    </div>
  )
}

type AuthFormCardProps = {
  children: ReactNode
}

export function AuthFormCard({ children }: AuthFormCardProps) {
  return (
    <div
      className="w-full rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
      style={{ borderColor: LOGIN_COLORS.inputBorder }}
    >
      <div
        className="flex flex-col gap-4"
        style={{
          paddingLeft: LOGIN_CARD.paddingX,
          paddingRight: LOGIN_CARD.paddingX,
          paddingTop: LOGIN_CARD.paddingTop,
          paddingBottom: LOGIN_CARD.paddingBottom,
        }}
      >
        {children}
      </div>
    </div>
  )
}
