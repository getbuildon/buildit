"use client"

import { Mail } from "lucide-react"
import { useEffect, type ReactNode } from "react"

import { Icon } from "@/library/atoms/icon/Icon"
import { Logo } from "@/library/atoms/logo/Logo"
import { installFocusModality } from "@/library/foundations/focus/modality"
import { AuthLayout } from "@/library/layouts/auth/AuthLayout"
import { Field } from "@/library/molecules/field/Field"
import { InputGroup } from "@/library/molecules/input-group/InputGroup"
import { AuthHero } from "@/library/organisms/auth/Auth"
import type { LoginAudience } from "@/lib/auth/loginAudience"
import { sanitizeEmailInput } from "@/lib/landing/emailInput"

/**
 * Marco de las pantallas de acceso (ingresar y recuperar contraseña), armado con la
 * librería BuildOn: foto a la izquierda desde 1024 px y la card sobre el naranja.
 * Es la versión de la app de «Pantallas/Acceso» del catálogo.
 */
const HERO_IMAGE = "/login/hero-bg.jpg"

const HEROES: Record<LoginAudience, { title: string; highlight: string; subtitle: string }> = {
  equipo: {
    title: "Seguimiento de obra claro, centralizado y en tiempo real.",
    highlight: "centralizado",
    subtitle:
      "Gestiona tus proyectos de construcción con total visibilidad. Monitorea avances, coordina equipos y mantén informados a tus clientes desde una sola plataforma.",
  },
  cliente: {
    title: "Seguí el avance de tu inversión con total transparencia.",
    highlight: "transparencia",
    subtitle:
      "Consultá el progreso de tus unidades, recibí novedades y accedé a toda la información del proyecto desde un solo lugar.",
  },
}

type PantallaDeAccesoProps = {
  audience?: LoginAudience
  children: ReactNode
  belowCard?: ReactNode
}

export function PantallaDeAcceso({ audience = "equipo", children, belowCard }: PantallaDeAccesoProps) {
  const hero = HEROES[audience]

  // Con mouse o dedo no se pinta el anillo de foco en botones; con teclado sí.
  useEffect(() => installFocusModality(), [])

  return (
    <AuthLayout
      hero={
        <AuthHero
          imageSrc={HERO_IMAGE}
          title={hero.title}
          highlight={hero.highlight}
          subtitle={hero.subtitle}
          footer="Desarrollado por Elemental Haus"
          logoHref="/"
        />
      }
      intro={
        <>
          <Logo size="md" className="text-action-ink" />
          <p className="hidden max-w-auth text-title text-action-ink md:block">{hero.title}</p>
        </>
      }
      belowCard={belowCard}
    >
      {children}
    </AuthLayout>
  )
}

type CampoDeCorreoProps = {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function CampoDeCorreo({ value, onChange, error, disabled }: CampoDeCorreoProps) {
  return (
    <Field label="Correo electrónico" error={error}>
      <InputGroup
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="tu@ejemplo.com"
        start={<Icon icon={Mail} />}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(sanitizeEmailInput(event.target.value))}
      />
    </Field>
  )
}
