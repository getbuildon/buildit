import { Slot } from "@radix-ui/react-slot"
import { ArrowUpRight } from "lucide-react"
import type { ComponentProps } from "react"
import { cn } from "../../lib/cn"

export type LinkProps = ComponentProps<"a"> & {
  /** Abre en otra pestaña: suma el ícono, rel seguro y el aviso al lector de pantalla. */
  external?: boolean
  /** Tono del texto: naranja (default) o el de la tinta, para links dentro de un párrafo. */
  tone?: "action" | "ink"
  /** Para envolver el Link de next/link y mantener el prefetch. */
  asChild?: boolean
}

/** Link de texto. Navega; si hace una acción, es un Button. */
export function Link({ external = false, tone = "action", asChild = false, className, children, ...props }: LinkProps) {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      data-slot="link"
      className={cn(
        "focus-ring inline-flex items-center gap-related rounded-box underline-offset-4 hover:underline",
        tone === "action" ? "text-action-text" : "text-ink underline decoration-line-strong hover:decoration-current",
        className,
      )}
      {...(external && !asChild ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      {external ? (
        <>
          <ArrowUpRight className="size-icon-xs" style={{ strokeWidth: "var(--icon-stroke)" }} aria-hidden />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </>
      ) : null}
    </Comp>
  )
}
