/** Etiqueta corta para pills de piso: nombre completo si es una palabra; iniciales (+ números) si hay más. */
export function getFloorShortLabel(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return name
  if (tokens.length === 1) return tokens[0]

  return tokensFromFloorName(tokens)
}

export type FloorLabelInput = {
  name: string
  identifier?: string | null
}

export type UnitLabelInput = {
  id: string
  code?: string | null
  name?: string | null
}

/** Etiqueta de piso para filtros/pills: prioriza el identificador configurado. */
export function getFloorDisplayLabel(floor: FloorLabelInput): string {
  const identifier = floor.identifier?.trim()
  if (identifier) return identifier
  return getFloorShortLabel(floor.name)
}

/** Prefijo de piso para pills de unidad: una palabra → primera letra; varias → iniciales (+ números). */
export function getFloorUnitPrefix(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return name
  if (tokens.length === 1) {
    const first = tokens[0][0]
    return first ? first.toUpperCase() : name
  }

  return tokensFromFloorName(tokens)
}

function tokensFromFloorName(tokens: string[]): string {
  return tokens
    .map((token) => {
      if (/^\d+$/.test(token)) return token
      const first = token[0]
      return first ? first.toUpperCase() : ""
    })
    .join("")
}

export function formatUnitSequenceNumber(index: number): string {
  return String(index).padStart(2, "0")
}

/** Etiqueta secuencial de unidad (01, 02…) — fallback cuando no hay código. */
export function getUnitSequenceLabel(unitIndex: number): string {
  return formatUnitSequenceNumber(unitIndex)
}

export function getUnitSequenceIndex(
  units: ReadonlyArray<{ id: string }>,
  unitId: string,
): number | null {
  const index = units.findIndex((unit) => unit.id === unitId)
  if (index === -1) return null
  return index + 1
}

/** Código visible de unidad: prioriza el ID configurado (code). */
export function getUnitDisplayCode(unit: UnitLabelInput, unitIndex?: number): string {
  const code = unit.code?.trim()
  if (code) return code
  if (unitIndex != null && unitIndex > 0) return formatUnitSequenceNumber(unitIndex)
  return "—"
}

export function getUnitLabelInFloor(
  units: ReadonlyArray<UnitLabelInput>,
  unitId: string,
): string {
  const index = getUnitSequenceIndex(units, unitId)
  if (index == null) return "—"
  const unit = units.find((item) => item.id === unitId)
  if (!unit) return "—"
  return getUnitDisplayCode(unit, index)
}

/** Pill compacta de unidad; prioriza el código configurado. */
export function getUnitPillLabel(
  floor: FloorLabelInput,
  unit: UnitLabelInput,
  unitIndex?: number,
): string {
  const code = unit.code?.trim()
  if (code) return code

  const index = unitIndex ?? getUnitSequenceIndex([unit], unit.id)
  if (index == null || index <= 0) return "—"

  const floorIdentifier = floor.identifier?.trim()
  if (floorIdentifier) {
    return `${floorIdentifier}${formatUnitSequenceNumber(index)}`
  }

  return `${getFloorUnitPrefix(floor.name)}${formatUnitSequenceNumber(index)}`
}
