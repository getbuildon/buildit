/** Etiqueta corta para pills de piso: nombre completo si es una palabra; iniciales (+ números) si hay más. */
export function getFloorShortLabel(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return name
  if (tokens.length === 1) return tokens[0]

  return tokensFromFloorName(tokens)
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

/** Etiqueta de unidad dentro de un piso: solo orden secuencial (01, 02, 03…). */
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

export function getUnitLabelInFloor(
  units: ReadonlyArray<{ id: string }>,
  unitId: string,
): string {
  const index = getUnitSequenceIndex(units, unitId)
  return index != null ? formatUnitSequenceNumber(index) : "—"
}

/** @deprecated Preferir getUnitSequenceLabel cuando el piso ya está en contexto. */
export function getUnitPillLabel(floorName: string, unitIndex: number): string {
  return `${getFloorUnitPrefix(floorName)}${formatUnitSequenceNumber(unitIndex)}`
}
