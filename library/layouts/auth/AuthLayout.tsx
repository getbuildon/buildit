import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { MAIN_ID, SkipLink } from "../skip-link"

export type AuthLayoutProps = {
  /** La mitad de la foto (AuthHero). Solo desde 1024 px. */
  hero?: ReactNode
  /** Arriba de la card en celular y tablet: el logo y, en tablet, la frase. Se oculta desde 1024 px. */
  intro?: ReactNode
  /** La card del formulario (AuthCard). */
  children: ReactNode
  /** Debajo de la card: un link, una ayuda. */
  belowCard?: ReactNode
  className?: string
}

/**
 * Acceso: ingresar (equipo y clientes) y recuperar la contraseña. Igual que hoy: foto a
 * la izquierda desde 1024 px (proporción 902/997) y, a la derecha, la card sobre el
 * naranja de marca con el círculo de fondo. En celular y tablet, el naranja ocupa toda
 * la pantalla con el logo arriba de la card.
 */
export function AuthLayout({ hero, intro, children, belowCard, className }: AuthLayoutProps) {
  return (
    <div className={cn("relative min-h-dvh bg-brand", className)}>
      <SkipLink />
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,902fr)_minmax(0,997fr)]">
        {hero ? <div className="hidden lg:flex">{hero}</div> : null}
        <main id={MAIN_ID} tabIndex={-1} className={cn("relative flex min-h-dvh flex-col overflow-x-hidden outline-none", !hero && "lg:col-span-2")}>
          {/* El círculo de fondo: decoración, invisible para el lector de pantalla. */}
          <svg
            aria-hidden
            viewBox="0 0 931 1011"
            fill="none"
            className="pointer-events-none absolute top-1/2 left-1/2 hidden w-[min(88vw,820px)] -translate-1/2 opacity-90 lg:block"
          >
            <path
              d="M468 735.5V1010.5M929.5 465.5C929.5 721.76 721.76 929.5 465.5 929.5C209.24 929.5 1.5 721.76 1.5 465.5C1.5 209.24 209.24 1.5 465.5 1.5C721.76 1.5 929.5 209.24 929.5 465.5Z"
              stroke="white"
              strokeOpacity="0.3"
              strokeWidth="3"
            />
          </svg>
          <div className="relative mx-auto flex w-full flex-1 flex-col items-center justify-center px-group py-6 sm:px-block sm:py-chapter md:py-12">
            {intro ? <div className="mb-block flex flex-col items-center gap-group text-center lg:hidden">{intro}</div> : null}
            {children}
            {belowCard ? <div className="mt-group w-full max-w-auth sm:mt-5">{belowCard}</div> : null}
          </div>
        </main>
      </div>
    </div>
  )
}

export type CenteredLayoutProps = {
  children: ReactNode
  /** Con velo oscuro encima del fondo (confirmar el registro, como hoy). */
  dimmed?: boolean
  className?: string
}

/** Una card sola en el centro de la pantalla: mensajes de invitación, confirmar el registro. */
export function CenteredLayout({ children, dimmed = false, className }: CenteredLayoutProps) {
  return (
    <div className={cn("relative min-h-dvh bg-canvas-sunken text-ink", className)}>
      <SkipLink />
      {dimmed ? <div aria-hidden className="pointer-events-none absolute inset-0 bg-scrim" /> : null}
      <main id={MAIN_ID} tabIndex={-1} className="relative flex min-h-dvh items-center justify-center px-6 py-10 outline-none">
        {children}
      </main>
    </div>
  )
}
