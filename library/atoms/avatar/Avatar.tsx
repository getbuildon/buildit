import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "../../lib/cn"
import { tagTones, type TagTone } from "../tag/Tag"

export const avatarSizes = ["sm", "md", "lg", "xl"] as const
export type AvatarSize = (typeof avatarSizes)[number]

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-avatar-sm text-micro",
  md: "size-avatar-md text-meta font-medium",
  lg: "size-avatar-lg text-label",
  xl: "size-16 text-section font-semibold",
}

const toneClass: Record<TagTone, string> = {
  naranja: "bg-tono-naranja-fondo text-tono-naranja-tinta",
  azul: "bg-tono-azul-fondo text-tono-azul-tinta",
  verde: "bg-tono-verde-fondo text-tono-verde-tinta",
  amarillo: "bg-tono-amarillo-fondo text-tono-amarillo-tinta",
  rojo: "bg-tono-rojo-fondo text-tono-rojo-tinta",
  violeta: "bg-tono-violeta-fondo text-tono-violeta-tinta",
  turquesa: "bg-tono-turquesa-fondo text-tono-turquesa-tinta",
  rosa: "bg-tono-rosa-fondo text-tono-rosa-tinta",
}

/** Iniciales: primera letra del nombre y del apellido. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase() || "?"
}

/** El mismo nombre siempre da el mismo tono. */
export function toneOf(name: string): TagTone {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return tagTones[hash % tagTones.length]
}

export type AvatarProps = {
  /** Nombre completo. Sale de acá el texto alternativo, las iniciales y el tono. */
  name: string
  src?: string | null
  size?: AvatarSize
  /** Tono fijo. Sin esto, sale del nombre. */
  tone?: TagTone
  className?: string
}

/** Foto de la persona o, si no hay, sus iniciales sobre un tono fijo. */
export function Avatar({ name, src, size = "md", tone, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-pill", sizeClass[size], className)}
    >
      {src ? <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback
        delayMs={src ? 400 : 0}
        className={cn("flex size-full items-center justify-center", toneClass[tone ?? toneOf(name)])}
      >
        <span aria-hidden>{initialsOf(name)}</span>
        <span className="sr-only">{name}</span>
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
