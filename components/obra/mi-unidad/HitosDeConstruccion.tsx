"use client"

import { Check, Circle } from "lucide-react"

import { Badge } from "@/library/atoms/badge/Badge"
import { Icon } from "@/library/atoms/icon/Icon"
import { cn } from "@/library/lib/cn"

import { parseDraftDateString } from "@/lib/projects/createProjectDraft"
import {
  PORTAL_MILESTONE_STATUS_LABELS,
  type PortalMilestoneItem,
} from "@/lib/projects/portalClientesTypes"

/** La fecha del hito en formato corto (dd/mm/aaaa). Si no se puede leer, va tal cual. */
function formatearFecha(valor: string | null): string | null {
  if (!valor) return null
  const fecha = parseDraftDateString(valor)
  if (!fecha) return valor
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/**
 * Línea de tiempo de los hitos de la obra: completos en verde, el que está en curso en
 * azul y los que faltan en gris. Es «MilestoneTimeline» del catálogo con datos reales.
 */
export function HitosDeConstruccion({ hitos }: { hitos: PortalMilestoneItem[] }) {
  if (hitos.length === 0) {
    return <p className="text-body text-ink-muted">Todavía no hay hitos de construcción publicados.</p>
  }

  return (
    <ol className="flex flex-col">
      {hitos.map((hito, indice) => {
        const ultimo = indice === hitos.length - 1
        const completo = hito.status === "completed"
        const enCurso = hito.status === "in_progress"
        const fecha = formatearFecha(hito.estimatedDate)
        const descripcion = hito.description.trim()

        return (
          <li key={hito.id} aria-current={enCurso ? "step" : undefined} className="flex gap-group">
            <div className="flex w-7 shrink-0 flex-col items-center">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-pill border-2",
                  completo && "border-fn-ok-line bg-fn-ok-canvas text-fn-ok",
                  enCurso && "border-fn-info-line bg-fn-info-canvas text-fn-info",
                  !completo && !enCurso && "border-line bg-canvas-raised text-ink-muted",
                )}
              >
                <Icon icon={completo ? Check : Circle} size="xs" className={enCurso ? "fill-current" : undefined} />
              </span>
              {ultimo ? null : (
                <span
                  aria-hidden
                  className={cn(
                    "mt-related min-h-6 w-0.5 flex-1 rounded-pill",
                    completo ? "bg-fn-ok-line" : enCurso ? "bg-fn-info-line" : "bg-line",
                  )}
                />
              )}
            </div>
            <div className={cn("flex min-w-0 flex-1 gap-snug", ultimo ? "pb-0" : "pb-block")}>
              <div className="min-w-0 flex-1">
                <p className="text-reading font-medium text-ink">
                  {hito.name}
                  {/* El estado de los completos y pendientes se ve solo por color e ícono:
                      acá se lo decimos al lector de pantalla. */}
                  <span className="sr-only">, {PORTAL_MILESTONE_STATUS_LABELS[hito.status].toLowerCase()}</span>
                </p>
                {descripcion ? <p className="pt-0.5 text-body text-ink-muted">{hito.description}</p> : null}
                {enCurso ? (
                  <Badge tone="info" size="compact" className="mt-compact rounded-compact">
                    En progreso
                  </Badge>
                ) : null}
              </div>
              {fecha ? (
                <Badge
                  tone={completo ? "ok" : enCurso ? "info" : "neutral"}
                  className="shrink-0 self-start whitespace-nowrap rounded-compact font-regular"
                >
                  {completo ? "✓ " : "Est. "}
                  {fecha}
                </Badge>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
