export const STRUCTURE_UNIT_TYPES = [
  "Departamento",
  "Oficina",
  "SUM",
  "Patio",
  "Piscina",
  "Terraza",
  "Estacionamiento",
  "Otro",
] as const

export type StructureUnitType = (typeof STRUCTURE_UNIT_TYPES)[number]

export const UNIT_ROOM_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const
export type UnitRoomCount = (typeof UNIT_ROOM_COUNT_OPTIONS)[number]

export const OFFICE_SIZE_OPTIONS = ["S", "M", "L", "XL"] as const
export type OfficeSize = (typeof OFFICE_SIZE_OPTIONS)[number]

export type UnitVariantField = "roomCount" | "officeSize"

const LEGACY_UNIT_TYPE_MAP: Record<string, StructureUnitType> = {
  Cochera: "Estacionamiento",
  Local: "Otro",
  Bodega: "Otro",
  Gimnasio: "Otro",
  Depto: "Departamento",
}

export function normalizeUnitType(
  type: string | null | undefined,
): StructureUnitType | null {
  const trimmed = type?.trim()
  if (!trimmed) return null
  if (STRUCTURE_UNIT_TYPES.includes(trimmed as StructureUnitType)) {
    return trimmed as StructureUnitType
  }
  return LEGACY_UNIT_TYPE_MAP[trimmed] ?? null
}

export function getUnitVariantField(
  type: StructureUnitType | string | null | undefined,
): UnitVariantField | null {
  const normalized = normalizeUnitType(type)
  if (normalized === "Departamento") return "roomCount"
  if (normalized === "Oficina") return "officeSize"
  return null
}

export function getUnitVariantFieldLabel(
  type: StructureUnitType | string | null | undefined,
): string {
  const field = getUnitVariantField(type)
  if (field === "officeSize") return "Tamaño"
  return "Ambientes"
}

export function isUnitVariantFieldEnabled(
  type: StructureUnitType | string | null | undefined,
): boolean {
  return getUnitVariantField(type) !== null
}

export function getUnitDashboardLabel(input: {
  unit_type: string | null
  name: string | null
  room_count?: number | null
}): string {
  const type = normalizeUnitType(input.unit_type) ?? input.unit_type?.trim() ?? "Unidad"

  if (type === "Departamento") {
    const rooms = input.room_count
    if (rooms != null && rooms > 0) {
      return `Dpto. ${rooms} Amb.`
    }
    return "Departamento"
  }

  if (type === "Oficina") {
    const size = input.name?.trim()
    if (size) return `Oficina ${size}`
    return "Oficina"
  }

  return type
}

export function unitTypeToDbFields(unit: {
  type: StructureUnitType
  roomCount: string
  officeSize: string
}): { room_count: number | null; name: string | null } {
  if (unit.type === "Departamento") {
    const count = parseInt(unit.roomCount, 10)
    return {
      room_count: Number.isFinite(count) && count > 0 ? count : null,
      name: null,
    }
  }

  if (unit.type === "Oficina") {
    const size = unit.officeSize.trim()
    return {
      room_count: null,
      name: size || null,
    }
  }

  return { room_count: null, name: null }
}

export function dbFieldsToUnitDraft(input: {
  unit_type: string | null
  name: string | null
  rooms: number | null
}): { roomCount: string; officeSize: string } {
  const type = normalizeUnitType(input.unit_type)

  if (type === "Oficina") {
    return { roomCount: "", officeSize: input.name?.trim() ?? "" }
  }

  if (type === "Departamento") {
    return { roomCount: input.rooms?.toString() ?? "", officeSize: "" }
  }

  return { roomCount: "", officeSize: "" }
}
