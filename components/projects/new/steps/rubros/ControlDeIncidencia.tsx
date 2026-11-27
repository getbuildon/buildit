"use client"

/* Control de incidencia de un rubro (cuánto pesa en el avance de la obra), armado con la
   librería. Mantiene el mismo comportamiento que tenía el control anterior: tocar el valor
   abre la edición, Auto/Manual cambia el modo y, al salir del control, se guarda. */

import { useEffect, useRef, type MouseEvent } from "react"
import { CircleAlert, Info } from "lucide-react"
import { Icon } from "@/library/atoms/icon/Icon"
import { Tooltip } from "@/library/atoms/tooltip/Tooltip"
import { InputGroup } from "@/library/molecules/input-group/InputGroup"
import { Segmented } from "@/library/molecules/segmented/Segmented"
import { cn } from "@/library/lib/cn"
import {
  finalizeManualRubroWeightPercent,
  getRubroEffectiveWeightDisplay,
  isRubroWeightAuto,
  parseRubroWeightInput,
  RUBRO_INCIDENCE_TOOLTIP,
  RUBRO_WEIGHT_OVER_LIMIT_MESSAGE,
} from "@/lib/projects/rubroWeights"
import type { RubroItemDraft } from "@/lib/projects/createProjectDraft"

type Modo = "auto" | "manual"

const OPCIONES_DE_MODO = [
  { value: "auto", label: "Auto" },
  { value: "manual", label: "Manual" },
] as const

/** Deja solo números y un decimal; si pasa de 100, queda en 100. */
function limpiarPorcentaje(texto: string): string {
  const normalizado = texto.replace(",", ".")
  if (normalizado === "") return ""

  const limpio = normalizado.replace(/[^\d.]/g, "")
  const [entero, ...resto] = limpio.split(".")
  const digitos = resto.length === 0 ? entero : `${entero}.${resto.join("").slice(0, 1)}`

  const numero = Number.parseFloat(digitos)
  if (Number.isFinite(numero) && numero > 100) return "100"

  return digitos
}

function formatearBorrador(valor: string): string {
  const recortado = valor.trim()
  if (!recortado) return ""

  const numero = Number.parseFloat(recortado.replace(",", "."))
  if (!Number.isFinite(numero)) return ""

  const acotado = Math.min(100, Math.max(0, numero))
  const redondeado = Math.round(acotado * 10) / 10
  return Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(1)
}

/** Al pasar a Manual, arranca con el valor que mostraba en Auto. */
function semillaManual(textoVisible: string): string {
  return formatearBorrador(textoVisible.replace(/%/g, "").trim())
}

function enfocarPorcentaje(input: HTMLInputElement | null) {
  if (!input) return
  input.focus()
  input.select()
}

/** Valida el porcentaje manual que se está editando. Devuelve el error o null. */
export function validarIncidencia(auto: boolean, porcentaje: string): string | null {
  if (auto) return null
  const normalizado = finalizeManualRubroWeightPercent(porcentaje)
  if (parseRubroWeightInput(normalizado) == null) {
    return "Ingresá un porcentaje válido entre 0 y 100."
  }
  return null
}

type ControlDeIncidenciaProps = {
  /** Nombre del rubro, para las etiquetas que lee el lector de pantalla. */
  nombreRubro: string
  textoVisible: string
  auto: boolean
  editable?: boolean
  porcentaje?: string
  onPorcentajeChange?: (valor: string) => void
  onAutoChange?: (auto: boolean) => void
  /** Sin editar: tocar el valor o un modo abre la edición. */
  onActivar?: (modo?: Modo) => void
  conError?: boolean
  mensajeDeError?: string
  enfocarAlAbrir?: boolean
  onSalir?: () => void
}

export function ControlDeIncidencia({
  nombreRubro,
  textoVisible,
  auto,
  editable = false,
  porcentaje = "",
  onPorcentajeChange,
  onAutoChange,
  onActivar,
  conError = false,
  mensajeDeError = RUBRO_WEIGHT_OVER_LIMIT_MESSAGE,
  enfocarAlAbrir = false,
  onSalir,
}: ControlDeIncidenciaProps) {
  const raizRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mostrarCampo = editable && !auto
  const mostrarError = conError && !auto
  const modo: Modo = auto ? "auto" : "manual"
  const interactivo = editable || Boolean(onActivar)

  useEffect(() => {
    if (!enfocarAlAbrir || !mostrarCampo) return
    enfocarPorcentaje(inputRef.current)
  }, [enfocarAlAbrir, mostrarCampo])

  const cambiarModo = (siguiente: Modo) => {
    if (onActivar) {
      onActivar(siguiente)
      if (siguiente === "manual") {
        requestAnimationFrame(() => enfocarPorcentaje(inputRef.current))
      }
      return
    }

    const siguienteAuto = siguiente === "auto"
    onAutoChange?.(siguienteAuto)
    if (!siguienteAuto && !porcentaje.trim()) {
      onPorcentajeChange?.(semillaManual(textoVisible))
    }
    if (!siguienteAuto) {
      requestAnimationFrame(() => enfocarPorcentaje(inputRef.current))
    }
  }

  // Sin editar, tocar el modo que ya está elegido también abre la edición (como antes).
  const tocarModoActivo = (event: MouseEvent<HTMLDivElement>) => {
    if (!onActivar) return
    const item = (event.target as HTMLElement).closest('[data-state="on"]')
    if (item) onActivar(modo)
  }

  return (
    <div
      ref={raizRef}
      role="group"
      aria-label={`Incidencia de ${nombreRubro}: ${textoVisible}${auto ? " (automático)" : ""}${mostrarError ? `. ${mensajeDeError}` : ""}`}
      onBlur={(event) => {
        if (!editable || !onSalir) return
        const siguiente = event.relatedTarget as Node | null
        if (siguiente && raizRef.current?.contains(siguiente)) return
        onSalir()
      }}
      className="flex shrink-0 items-center gap-compact"
    >
      <Tooltip content={mostrarError ? mensajeDeError : <span className="whitespace-pre-line">{RUBRO_INCIDENCE_TOOLTIP}</span>}>
        <button
          type="button"
          aria-label={
            mostrarError
              ? `Error en la incidencia de ${nombreRubro}`
              : `Qué es la incidencia de ${nombreRubro}`
          }
          className={cn(
            "focus-ring grid size-6 cursor-help place-items-center rounded-pill",
            mostrarError ? "text-fn-danger" : "text-ink-muted",
          )}
        >
          <Icon icon={mostrarError ? CircleAlert : Info} size="xs" />
        </button>
      </Tooltip>

      {mostrarCampo ? (
        <InputGroup
          ref={inputRef}
          size="compact"
          end="%"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`Porcentaje de incidencia manual de ${nombreRubro}`}
          invalid={mostrarError}
          value={porcentaje}
          onChange={(event) => onPorcentajeChange?.(limpiarPorcentaje(event.target.value))}
          onBlur={(event) => {
            const formateado = finalizeManualRubroWeightPercent(porcentaje)
            if (formateado !== porcentaje) onPorcentajeChange?.(formateado)

            const siguiente = event.relatedTarget as Node | null
            if (siguiente && raizRef.current?.contains(siguiente)) return
            onSalir?.()
          }}
          groupClassName="w-20"
          className="text-right tabular-nums"
        />
      ) : onActivar ? (
        <button
          type="button"
          onClick={() => onActivar()}
          aria-label={`Editar la incidencia de ${nombreRubro}: ${textoVisible}`}
          className={cn(
            "focus-ring state-veil h-control-compact w-20 cursor-pointer rounded-control px-compact text-right text-label tabular-nums",
            mostrarError ? "text-fn-danger" : "text-ink",
          )}
        >
          {textoVisible}
        </button>
      ) : (
        <span className="w-20 text-right text-label tabular-nums">{textoVisible}</span>
      )}

      {interactivo ? (
        // El mousedown no mueve el foco: así cambiar de modo no cierra la edición.
        <div
          onMouseDownCapture={(event) => event.preventDefault()}
          onClickCapture={tocarModoActivo}
        >
          <Segmented
            size="compact"
            label={`Cómo se calcula la incidencia de ${nombreRubro}`}
            value={modo}
            onValueChange={(valor) => cambiarModo(valor as Modo)}
            options={OPCIONES_DE_MODO}
          />
        </div>
      ) : (
        <span className="text-meta text-ink-muted">{auto ? "Auto" : "Manual"}</span>
      )}
    </div>
  )
}

/** El valor de incidencia sin editar: tocarlo abre la edición. */
export function InsigniaDeIncidencia({
  rubro,
  todosLosRubros,
  conError = false,
  onActivar,
}: {
  rubro: RubroItemDraft
  todosLosRubros: RubroItemDraft[]
  conError?: boolean
  onActivar?: (modo?: Modo) => void
}) {
  return (
    <ControlDeIncidencia
      nombreRubro={rubro.name.trim() || "Rubro sin nombre"}
      textoVisible={getRubroEffectiveWeightDisplay(rubro, todosLosRubros)}
      auto={isRubroWeightAuto(rubro)}
      conError={conError}
      onActivar={onActivar}
    />
  )
}

/** La incidencia mientras se edita: muestra el reparto como quedaría con el valor nuevo. */
export function EditorDeIncidencia({
  nombreRubro,
  porcentaje,
  auto,
  todosLosRubros,
  rubroId,
  onPorcentajeChange,
  onAutoChange,
  conError = false,
  enfocarAlAbrir = false,
  onSalir,
}: {
  nombreRubro: string
  porcentaje: string
  auto: boolean
  todosLosRubros: RubroItemDraft[]
  rubroId: string
  onPorcentajeChange: (valor: string) => void
  onAutoChange: (auto: boolean) => void
  conError?: boolean
  enfocarAlAbrir?: boolean
  onSalir?: () => void
}) {
  const rubroPrevio: RubroItemDraft = {
    id: rubroId,
    name: "",
    trackingType: "Porcentaje",
    weightPercent: auto ? "" : porcentaje,
    tasks: [],
  }
  const rubrosPrevios = todosLosRubros.map((rubro) =>
    rubro.id === rubroId ? rubroPrevio : rubro,
  )

  return (
    <ControlDeIncidencia
      nombreRubro={nombreRubro}
      textoVisible={getRubroEffectiveWeightDisplay(rubroPrevio, rubrosPrevios)}
      auto={auto}
      editable
      porcentaje={porcentaje}
      onPorcentajeChange={onPorcentajeChange}
      onAutoChange={onAutoChange}
      conError={conError}
      enfocarAlAbrir={enfocarAlAbrir}
      onSalir={onSalir}
    />
  )
}
