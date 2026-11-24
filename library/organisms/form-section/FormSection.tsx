import type { ReactNode } from "react"
import { cn } from "../../lib/cn"
import { Button } from "../../atoms/button/Button"

export type FormSectionProps = {
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Un bloque de configuración: título y explicación a la izquierda, campos a la
 * derecha (en el celular, uno arriba del otro). Como la configuración de Stripe o Linear.
 */
export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn("grid gap-group border-b border-line py-block last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-block", className)}>
      <div className="flex flex-col gap-related">
        <h2 className="text-section">{title}</h2>
        {description ? <p className="text-body text-ink-muted">{description}</p> : null}
      </div>
      <div className="flex max-w-reading flex-col gap-group">{children}</div>
    </section>
  )
}

export type FormActionsProps = {
  /** Hay cambios sin guardar: muestra el aviso y habilita Guardar. */
  dirty: boolean
  onSave: () => void
  onDiscard: () => void
  saving?: boolean
  saveLabel?: string
  className?: string
}

/**
 * Barra de guardar, fija abajo de la pantalla mientras hay cambios. Dice que hay
 * cambios sin guardar (el lector de pantalla también) y deja descartarlos.
 */
export function FormActions({ dirty, onSave, onDiscard, saving = false, saveLabel = "Guardar cambios", className }: FormActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-(--z-sticky) flex items-center gap-snug border-t border-line bg-canvas/95 px-group py-snug backdrop-blur-sm",
        className,
      )}
    >
      <p className="text-meta text-ink-muted" aria-live="polite">
        {dirty ? "Tenés cambios sin guardar." : "Todo guardado."}
      </p>
      <div className="ml-auto flex gap-snug">
        <Button variant="ghost" onClick={onDiscard} disabled={!dirty || saving}>
          Descartar
        </Button>
        <Button onClick={onSave} disabled={!dirty} loading={saving}>
          {saveLabel}
        </Button>
      </div>
    </div>
  )
}
