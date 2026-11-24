import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Logo } from "../../atoms/logo/Logo"

export type AuthHeroProps = {
  /** Foto de fondo (en la app, /login/hero-bg.jpg). Se ve en blanco y negro. */
  imageSrc: string
  /** Frase principal. La palabra de highlight va en naranja. */
  title: string
  highlight?: string
  subtitle: string
  /** Pie: «Desarrollado por Elemental Haus». */
  footer?: ReactNode
  /** El link del logo (por ejemplo a la home). Sin esto, el logo no es link. */
  logoHref?: string
}

/**
 * La mitad de la foto del acceso: imagen en blanco y negro con un velo negro, logo,
 * frase con una palabra en naranja, bajada y pie. Siempre oscura (isla con el tema
 * oscuro), también en modo claro.
 *
 * La frase es un <p>, no un h1: en celular esta mitad no se ve, y el título de la
 * pantalla tiene que ser el de la card (hoy, en celular, la pantalla queda sin h1).
 */
export function AuthHero({ imageSrc, title, highlight, subtitle, footer, logoHref }: AuthHeroProps) {
  const [before, after] = highlight && title.includes(highlight) ? title.split(highlight) : [title, undefined]
  const logo = <Logo size="lg" className="self-start text-ink" />
  return (
    <div data-theme="oscuro" className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-canvas text-ink">
      {/* eslint-disable-next-line @next/next/no-img-element -- la librería no depende de Next */}
      <img src={imageSrc} alt="" className="absolute inset-0 size-full object-cover grayscale" />
      <div aria-hidden className="absolute inset-0 bg-linear-135 from-veil-strong to-veil-soft" />
      <div className="relative flex flex-1 flex-col px-10 py-12 xl:px-16 xl:py-16 2xl:px-20 2xl:py-20">
        <div className="flex flex-1 flex-col justify-center gap-chapter pr-4 xl:pr-16 2xl:pr-24">
          {logoHref ? (
            <a href={logoHref} className="focus-ring w-fit rounded-box">
              {logo}
            </a>
          ) : (
            logo
          )}
          <div className="flex max-w-xl flex-col gap-group xl:max-w-2xl xl:gap-block">
            <p className="text-hero">
              {before}
              {after !== undefined ? <span className="text-brand">{highlight}</span> : null}
              {after}
            </p>
            <p className="max-w-lg text-hero-lede">{subtitle}</p>
          </div>
        </div>
        {footer ? <p className="text-body text-ink-muted">{footer}</p> : null}
      </div>
    </div>
  )
}

export type AuthCardProps = {
  /** Título de la pantalla (h1): «Iniciá sesión en tu cuenta». */
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * La card del formulario de acceso: blanca, 446 px, sombra destacada, sobre el naranja.
 * El título es el h1 de la pantalla.
 */
export function AuthCard({ title, description, children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-auth rounded-surface bg-canvas-raised px-block py-chapter text-ink shadow-lift md:px-6 md:py-12 lg:py-14",
        className,
      )}
    >
      <div className="flex flex-col gap-group lg:gap-block">
        <div className="flex flex-col gap-compact">
          <h1 className="text-title">{title}</h1>
          {description ? <p className="text-body text-ink-muted">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  )
}

export type MessageCardProps = {
  /** Arriba del título: un avatar, un ícono. */
  media?: ReactNode
  title: string
  description?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * Card centrada para un mensaje o un paso corto: invitación no válida, sesión
 * incorrecta, confirmar el registro. El título es el h1 de la pantalla.
 */
export function MessageCard({ media, title, description, children, className }: MessageCardProps) {
  return (
    <div className={cn("flex w-full max-w-dialog-narrow flex-col gap-block rounded-surface border border-line bg-canvas-raised p-6 text-ink shadow-near", className)}>
      <div className="flex flex-col items-center gap-snug text-center">
        {media}
        <h1 className="text-heading">{title}</h1>
        {description ? <p className="text-body text-ink-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}
