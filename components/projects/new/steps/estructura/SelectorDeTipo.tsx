"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/library/atoms/input/Input"
import { Select, SelectGroup, SelectItem } from "@/library/molecules/select/Select"
import {
  STRUCTURE_UNIT_TYPE_GROUPS,
  isUnitTypeGroupId,
} from "@/lib/projects/unitTypes"

/* Opción "Otro" de cada grupo: al elegirla se escribe un tipo propio. */
const OTRO = "Otro"
/* Opción que muestra el tipo propio que ya tiene el local. */
const ACTUAL = "__actual__"
const SEPARADOR = "::"

const TIPOS_FIJOS = new Set<string>(
  STRUCTURE_UNIT_TYPE_GROUPS.flatMap((group) =>
    group.types.filter((type) => type !== OTRO),
  ),
)

const valorDeOpcion = (groupId: string, type: string) =>
  `${groupId}${SEPARADOR}${type}`

type SelectorDeTipoProps = {
  value: string
  groupId?: string
  /** Mismo contrato que el selector anterior: tipo elegido y grupo al que pertenece. */
  onValueChange: (type: string, groupId: string) => void
  id?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  "aria-required"?: boolean
  className?: string
}

/**
 * Tipo de local, agrupado en «Unidad funcional» y «Área común» (como UnitTypeSelect del
 * catálogo). La opción «Otro» de cada grupo deja escribir un tipo propio: Enter o salir
 * del campo lo guarda, Escape cancela y vacío no cambia nada.
 */
export function SelectorDeTipo({
  value,
  groupId,
  onValueChange,
  className,
  ...aria
}: SelectorDeTipoProps) {
  const [editandoGrupo, setEditandoGrupo] = useState<string | null>(null)
  const [borrador, setBorrador] = useState("")
  const contenedorRef = useRef<HTMLSpanElement>(null)
  const volverAlSelector = useRef(false)
  const ignorarBlur = useRef(false)
  const campoRef = useRef<HTMLInputElement>(null)

  const esPropio = Boolean(value) && !TIPOS_FIJOS.has(value)
  const grupoElegido =
    (isUnitTypeGroupId(groupId) ? groupId : undefined) ??
    STRUCTURE_UNIT_TYPE_GROUPS.find((group) =>
      (group.types as readonly string[]).includes(value),
    )?.id ??
    STRUCTURE_UNIT_TYPE_GROUPS[0].id

  const valorSelect = !value
    ? undefined
    : esPropio
      ? valorDeOpcion(grupoElegido, ACTUAL)
      : valorDeOpcion(grupoElegido, value)

  // Al abrir el campo, el foco va ahí después de que la lista termina de cerrarse
  // (la lista devuelve el foco a su botón al cerrarse y lo haría perder).
  useEffect(() => {
    if (!editandoGrupo) return
    const timer = window.setTimeout(() => {
      campoRef.current?.focus()
      campoRef.current?.select()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [editandoGrupo])

  // Al terminar de escribir el tipo propio, el foco vuelve al selector.
  useEffect(() => {
    if (editandoGrupo || !volverAlSelector.current) return
    volverAlSelector.current = false
    contenedorRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
  }, [editandoGrupo])

  const terminarEdicion = (guardar: boolean) => {
    const grupo = editandoGrupo
    const texto = borrador.trim()
    volverAlSelector.current = true
    setEditandoGrupo(null)
    setBorrador("")
    if (guardar && grupo && texto) onValueChange(texto, grupo)
  }

  if (editandoGrupo) {
    return (
      <span ref={contenedorRef} className={className}>
        <Input
          {...aria}
          ref={campoRef}
          size="compact"
          value={borrador}
          placeholder="Escribí el tipo"
          onChange={(event) => setBorrador(event.target.value)}
          onBlur={() => {
            if (ignorarBlur.current) {
              ignorarBlur.current = false
              return
            }
            terminarEdicion(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              terminarEdicion(true)
            }
            if (event.key === "Escape") {
              event.preventDefault()
              ignorarBlur.current = true
              terminarEdicion(false)
            }
          }}
        />
      </span>
    )
  }

  return (
    <span ref={contenedorRef} className={className}>
      <Select
        {...aria}
        size="compact"
        value={valorSelect}
        placeholder="Seleccionar tipo"
        onValueChange={(next) => {
          const [grupo, tipo] = next.split(SEPARADOR)
          if (!grupo || !tipo || tipo === ACTUAL) return
          if (tipo === OTRO) {
            setBorrador(esPropio ? value : "")
            setEditandoGrupo(grupo)
            return
          }
          onValueChange(tipo, grupo)
        }}
      >
        {STRUCTURE_UNIT_TYPE_GROUPS.map((group) => (
          <SelectGroup key={group.id} label={group.label}>
            {group.types.map((type) =>
              type === OTRO ? (
                <SelectItem key={type} value={valorDeOpcion(group.id, OTRO)}>
                  Otro (escribir)
                </SelectItem>
              ) : (
                <SelectItem key={type} value={valorDeOpcion(group.id, type)}>
                  {type}
                </SelectItem>
              ),
            )}
            {esPropio && group.id === grupoElegido ? (
              <SelectItem value={valorDeOpcion(group.id, ACTUAL)}>{value}</SelectItem>
            ) : null}
          </SelectGroup>
        ))}
      </Select>
    </span>
  )
}
