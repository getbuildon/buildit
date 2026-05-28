import Image from "next/image"
import type { ReactNode } from "react"
import { BuiltItIsoIcon } from "@/components/brand/BuiltItIsoIcon"
import { BRAND_NAME } from "@/lib/brand"
import {
  LOGIN_CARD,
  LOGIN_COLORS,
  LOGIN_GRADIENT_LEFT,
  LOGIN_GRADIENT_MAIN,
  LOGIN_GRADIENT_RIGHT,
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
      className="relative min-h-screen text-white"
      style={{ backgroundImage: LOGIN_GRADIENT_MAIN }}
    >
      <main className="grid min-h-screen lg:grid-cols-[901.5fr_997.5fr]">
        <section
          className="relative hidden min-h-screen overflow-hidden lg:block"
          style={{ backgroundImage: LOGIN_GRADIENT_LEFT }}
        >
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/login/hero-bg.jpg"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="50vw"
            />
          </div>

          <div className="relative flex min-h-screen flex-col">
            <div className="flex flex-1 flex-col justify-center pl-24 pr-16">
              <div className="w-full max-w-[576px]">
                <div className="mb-10 flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white/10 px-2.5">
                    <BuiltItIsoIcon className="size-7 text-white" />
                  </div>
                  <span className={LOGIN_TYPE.brand}>{BRAND_NAME}</span>
                </div>

                <div className="flex flex-col gap-6">
                  <h1 className={LOGIN_TYPE.heroTitle}>
                    Seguimiento de obra claro, centralizado y en tiempo real
                  </h1>
                  <p
                    className={cn(LOGIN_TYPE.heroBody)}
                    style={{ color: LOGIN_COLORS.subtitle }}
                  >
                    Gestiona tus proyectos de construcción con total visibilidad.
                    Monitorea avances, coordina equipos y mantén informados a tus
                    clientes desde una sola plataforma.
                  </p>
                </div>
              </div>
            </div>

            <p
              className={cn("pb-16 pl-24", LOGIN_TYPE.heroFooter)}
              style={{ color: LOGIN_COLORS.footer }}
            >
              Desarrollado por Elemental Haus
            </p>
          </div>
        </section>

        <section
          className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20"
          style={{ backgroundImage: LOGIN_GRADIENT_RIGHT }}
        >
          <div
            className="flex w-full flex-col items-center"
            style={{ maxWidth: LOGIN_CARD.maxWidth }}
          >
            <div className="mb-6 flex items-center gap-3 self-start lg:hidden">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white/10 px-2.5">
                <BuiltItIsoIcon className="size-7 text-white" />
              </div>
              <span className={LOGIN_TYPE.brand}>{BRAND_NAME}</span>
            </div>

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
      className="w-full rounded-[16px] border bg-white shadow-[0_20px_12.5px_rgba(0,0,0,0.1),0_8px_5px_rgba(0,0,0,0.1)]"
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
