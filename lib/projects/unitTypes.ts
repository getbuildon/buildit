export const STRUCTURE_UNIT_TYPES = [
  "Departamento",
  "Oficina",
  "Estacionamiento",
  "SUM",
  "Lobby",
  "Piscina",
  "Patio",
  "Terraza",
  "Ascensor",
  "Palier",
  "Porche",
  "Otro",
] as const

export type StructureUnitType = (typeof STRUCTURE_UNIT_TYPES)[number]

export const STRUCTURE_UNIT_TYPE_GROUPS = [
  {
    id: "unidad-funcional",
    label: "Unidad funcional",
    types: [
      "Departamento",
      "Oficina",
      "Estacionamiento",
      "SUM",
      "Otro",
    ] as const satisfies readonly StructureUnitType[],
  },
  {
    id: "area-comun",
    label: "Área común",
    types: [
      "Lobby",
      "Piscina",
      "Patio",
      "Terraza",
      "Ascensor",
      "Palier",
      "Porche",
      "Otro",
    ] as const satisfies readonly StructureUnitType[],
  },
] as const

export type StructureUnitTypeGroupId =
  (typeof STRUCTURE_UNIT_TYPE_GROUPS)[number]["id"]

const COMMON_AREA_TYPES = new Set<StructureUnitType>([
  "Lobby",
  "Piscina",
  "Patio",
  "Terraza",
  "Ascensor",
  "Palier",
  "Porche",
])

export function getUnitTypeGroupId(
  type: StructureUnitType | string | null | undefined,
): StructureUnitTypeGroupId {
  const normalized = normalizeUnitType(type)
  if (normalized && COMMON_AREA_TYPES.has(normalized)) return "area-comun"
  return "unidad-funcional"
}

export function isUnitTypeGroupId(
  value: string | null | undefined,
): value is StructureUnitTypeGroupId {
  return value === "unidad-funcional" || value === "area-comun"
}

export function resolveUnitTypeCategory(
  type: StructureUnitType | string | null | undefined,
  stored?: string | null,
): StructureUnitTypeGroupId {
  if (isUnitTypeGroupId(stored)) return stored
  return getUnitTypeGroupId(type)
}

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

export function getCatalogUnitType(
  type: string | null | undefined,
): StructureUnitType {
  return normalizeUnitType(type) ?? "Otro"
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
): UnitVariantField {
  if (normalizeUnitType(type) === "Departamento") return "roomCount"
  return "officeSize"
}

export function getUnitVariantFieldLabel(
  type: StructureUnitType | string | null | undefined,
): string {
  return getUnitVariantField(type) === "roomCount" ? "Ambientes" : "Tamaño"
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
  type: StructureUnitType | string
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

  const size = unit.officeSize.trim()
  return {
    room_count: null,
    name: size || null,
  }
}

export function dbFieldsToUnitDraft(input: {
  unit_type: string | null
  name: string | null
  rooms: number | null
}): { roomCount: string; officeSize: string } {
  const type = normalizeUnitType(input.unit_type)

  if (type === "Departamento") {
    return { roomCount: input.rooms?.toString() ?? "", officeSize: "" }
  }

  return { roomCount: "", officeSize: input.name?.trim() ?? "" }
}
