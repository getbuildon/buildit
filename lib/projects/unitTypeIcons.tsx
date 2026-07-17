import {
  Briefcase,
  Car,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Sun,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react"
import { normalizeUnitType, type StructureUnitType } from "@/lib/projects/unitTypes"

export const UNIT_TYPE_ICONS: Record<StructureUnitType, LucideIcon> = {
  Departamento: Home,
  Oficina: Briefcase,
  SUM: LayoutGrid,
  Patio: Trees,
  Piscina: Waves,
  Terraza: Sun,
  Estacionamiento: Car,
  Otro: MoreHorizontal,
}

export function getUnitTypeIcon(type: string | null | undefined): LucideIcon {
  const normalized = normalizeUnitType(type)
  if (normalized) return UNIT_TYPE_ICONS[normalized]
  return Home
}
