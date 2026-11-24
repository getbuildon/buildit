import { X } from "lucide-react"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

export const tagTones = ["naranja", "azul", "verde", "amarillo", "rojo", "violeta", "turquesa", "rosa"] as const
export type TagTone = (typeof tagTones)[number]

/* Clases completas por tono: Tailwind las tiene que ver escritas para generarlas. */
const toneClass: Record<TagTone, { box: string; dot: string }> = {
  naranja: { box: "bg-tono-naranja-fondo text-tono-naranja-tinta", dot: "bg-tono-naranja-solido" },
  azul: { box: "bg-tono-azul-fondo text-tono-azul-tinta", dot: "bg-tono-azul-solido" },
  verde: { box: "bg-tono-verde-fondo text-tono-verde-tinta", dot: "bg-tono-verde-solido" },
  amarillo: { box: "bg-tono-amarillo-fondo text-tono-amarillo-tinta", dot: "bg-tono-amarillo-solido" },
  rojo: { box: "bg-tono-rojo-fondo text-tono-rojo-tinta", dot: "bg-tono-rojo-solido" },
  violeta: { box: "bg-tono-violeta-fondo text-tono-violeta-tinta", dot: "bg-tono-violeta-solido" },
  turquesa: { box: "bg-tono-turquesa-fondo text-tono-turquesa-tinta", dot: "bg-tono-turquesa-solido" },
  rosa: { box: "bg-tono-rosa-fondo text-tono-rosa-tinta", dot: "bg-tono-rosa-solido" },
}

export type TagProps = Omit<ComponentProps<"span">, "children"> & {
  children: string
  /** Se guarda el nombre del tono, nunca el color. */
  tone?: TagTone
  /** Punto del color sólido antes del texto. */
  dot?: boolean
  /** Si viene, muestra la cruz para quitar la etiqueta. */
  onRemove?: () => void
}

/** Categoría: rubro, unidad, tipología. No es un estado (para eso, Badge). */
export function Tag({ tone = "azul", dot = false, onRemove, className, children, ...props }: TagProps) {
  const colors = toneClass[tone]
  return (
    <span
      data-slot="tag"
      className={cn("inline-flex h-6 shrink-0 items-center gap-related rounded-pill px-compact text-meta font-medium", colors.box, className)}
      {...props}
    >
      {dot ? <span aria-hidden className={cn("size-2 rounded-pill", colors.dot)} /> : null}
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${children}`}
          className="focus-ring state-veil -mr-related inline-flex size-4 items-center justify-center rounded-pill"
        >
          <X className="size-3" style={{ strokeWidth: 2.25 }} aria-hidden />
        </button>
      ) : null}
    </span>
  )
}
