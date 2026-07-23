import {
  STRUCTURE_UNIT_TYPES,
  type StructureUnitType,
} from "@/lib/projects/unitTypes"
import type { InitialWorkTaskStatus } from "@/lib/projects/initialWorkStatus"

export { STRUCTURE_UNIT_TYPES, type StructureUnitType }

export type UnitRenderImageDraft = {
  file: File
  previewUrl: string
  fileName: string
  fileSize: number
  fileType: string
}

export type StructureUnitDraft = {
  id: string
  code: string
  type: StructureUnitType
  squareMeters: string
  roomCount: string
  officeSize: string
  /** URL de la planta ya guardada en storage. */
  planUrl: string | null
  /** Planta nueva pendiente de subir al guardar. */
  planImage: UnitRenderImageDraft | null
  planRemoved: boolean
  /** URL del render ya guardado en storage. */
  renderUrl: string | null
  /** Render nuevo pendiente de subir al guardar. */
  renderImage: UnitRenderImageDraft | null
  renderRemoved: boolean
}

export type StructureFloorDraft = {
  id: string
  name: string
  identifier: string
  level: string
  units: StructureUnitDraft[]
}

export const TASK_TRACKING_TYPES = [
  "Porcentaje",
  "Lista de verificación",
  "Por unidad",
] as const

export type TaskTrackingType = (typeof TASK_TRACKING_TYPES)[number]

export type RubroTaskDraft = {
  id: string
  name: string
  weightPercent: string
}

export type RubroItemDraft = {
  id: string
  name: string
  trackingType: TaskTrackingType
  tasks: RubroTaskDraft[]
}

export type RubroGroupDraft = {
  id: string
  name: string
  rubros: RubroItemDraft[]
  seedRubrosCount?: number
  seedTasksCount?: number
}

export const PROJECT_USER_TYPES = [
  "Owner",
  "Admin",
  "Supervisor",
  "Operador",
  "Cliente",
] as const

export type ProjectUserType = (typeof PROJECT_USER_TYPES)[number]

export const PROJECT_TEAM_ROLES = [
  "Founder",
  "Director General",
  "Desarrollador",
  "Administrador",
  "Gerente",
  "Project Manager",
  "Coordinador",
  "Director de Obra",
  "Residente",
  "Jefe de Obra",
  "Supervisor",
  "Lider de Proyecto",
  "Capataz",
  "Contratista",
  "Subcontratista",
  "Cliente",
] as const

export type ProjectTeamRole = (typeof PROJECT_TEAM_ROLES)[number]

export const USER_TYPE_ROLES: Record<ProjectUserType, readonly ProjectTeamRole[]> = {
  Owner: ["Founder", "Director General", "Desarrollador"],
  Admin: ["Administrador", "Gerente", "Project Manager", "Coordinador"],
  Supervisor: ["Director de Obra", "Residente", "Jefe de Obra", "Supervisor", "Lider de Proyecto"],
  Operador: ["Capataz", "Contratista", "Subcontratista"],
  Cliente: ["Cliente"],
}

export type TeamMemberDraft = {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: ProjectUserType
  role: ProjectTeamRole
  avatarUrl?: string | null
}

export const PROJECT_WORK_STAGES = ["not_started", "in_execution"] as const

export type ProjectWorkStage = (typeof PROJECT_WORK_STAGES)[number]

export type CreateProjectDraft = {
  companyId: string | null
  companyName: string
  projectName: string
  totalSurface: string
  location: string
  startDate: string
  endDate: string
  workStage: ProjectWorkStage
  floors: StructureFloorDraft[]
  groups: RubroGroupDraft[]
  unitTaskExclusions: Record<string, string[]>
  /** Estado inicial por tarea (solo obras en ejecución). */
  taskInitialStatuses: Record<string, InitialWorkTaskStatus>
  teamMembers: TeamMemberDraft[]
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function createDefaultUnit(): StructureUnitDraft {
  return {
    id: newId("unit"),
    code: "",
    type: "Departamento",
    squareMeters: "",
    roomCount: "",
    officeSize: "",
    planUrl: null,
    planImage: null,
    planRemoved: false,
    renderUrl: null,
    renderImage: null,
    renderRemoved: false,
  }
}

export function createDefaultFloor(floorIndex: number): StructureFloorDraft {
  return {
    id: newId("floor"),
    name: `Piso ${floorIndex}`,
    identifier: "",
    level: "",
    units: [],
  }
}

function makeRubro(name: string): RubroItemDraft {
  return { id: newId("rubro"), name, trackingType: "Porcentaje", tasks: [] }
}

export function createTemplateRubroGroups(): RubroGroupDraft[] {
  return [
    {
      id: newId("group"),
      name: "Trabajos Preliminares",
      rubros: [
        makeRubro("Cerco de Obra"),
        makeRubro("Instalaciones provisorias"),
        makeRubro("Demolición y limpieza"),
        makeRubro("Replanteo y nivelación"),
        makeRubro("Plan higiene y seguridad"),
        makeRubro("Logística"),
      ],
    },
    {
      id: newId("group"),
      name: "Obra Gruesa",
      rubros: [
        makeRubro("Estructura de Fundación"),
        makeRubro("Estructura Vertical"),
        makeRubro("Estructura Horizontal"),
        makeRubro("Cubiertas"),
        makeRubro("Cerramientos"),
        makeRubro("Contrapisos"),
        makeRubro("Revoques"),
        makeRubro("Herrería gruesa"),
        makeRubro("Aislaciones"),
      ],
    },
    {
      id: newId("group"),
      name: "Instalaciones Sanitarias",
      rubros: [
        makeRubro("Servicio de provisión de agua"),
        makeRubro("Servicio contra incendio"),
        makeRubro("Desagüe cloacal primario"),
        makeRubro("Desagüe cloacal secundario"),
        makeRubro("Desagüe equipos A.A."),
        makeRubro("Desagüe pluvial"),
        makeRubro("Piscina"),
      ],
    },
    {
      id: newId("group"),
      name: "Instalaciones Eléctricas",
      rubros: [
        makeRubro("Alimentación eléctrica general"),
        makeRubro("Tablero general y medidores"),
        makeRubro("Tableros seccionales"),
        makeRubro("Tomas y bocas"),
        makeRubro("Canalización y cableado"),
        makeRubro("Sistema detección incendio"),
        makeRubro("Sistema de generación eléctrica autónoma"),
        makeRubro("Sistema portero"),
        makeRubro("Sistema cámaras y seguridad"),
        makeRubro("Comunicación mecánica"),
        makeRubro("Portones y rampas"),
        makeRubro("Puesta a tierra y pararrayos"),
      ],
    },
    {
      id: newId("group"),
      name: "Obra Fina",
      rubros: [
        makeRubro("Revoques Finos"),
        makeRubro("Cielorrasos"),
        makeRubro("Carpetas"),
        makeRubro("Pisos, zócalos y revestimientos"),
        makeRubro("Carpinterías – Puertas, ventanas, barandas."),
        makeRubro("Herrería fina"),
        makeRubro("Pintura interior y exterior"),
        makeRubro("Instalación de artefactos sanitarios y griferías"),
        makeRubro("Instalación de artefactos eléctricos, tomas y puntos"),
        makeRubro("Amoblamiento"),
        makeRubro("Marmolería"),
        makeRubro("Ajustes y limpieza final de obra"),
      ],
    },
    {
      id: newId("group"),
      name: "Instalaciones Especiales",
      rubros: [
        makeRubro("Gas"),
        makeRubro("Energía solar"),
        makeRubro("Domótica"),
      ],
    },
  ]
}

export function createEmptyProjectDraft(): CreateProjectDraft {
  return {
    companyId: null,
    companyName: "",
    projectName: "",
    totalSurface: "",
    location: "",
    startDate: "",
    endDate: "",
    workStage: "not_started",
    floors: [],
    groups: createTemplateRubroGroups(),
    unitTaskExclusions: {},
    taskInitialStatuses: {},
    teamMembers: [],
  }
}

/** Convierte `YYYY-MM-DD` del draft a `Date` local. */
export function parseDraftDateString(value: string): Date | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined
  }

  return date
}

/** Serializa una fecha del picker al formato guardado en el draft. */
export function formatDraftDateString(date: Date | undefined): string {
  if (!date) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function createTeamMemberDraft(
  firstName: string,
  lastName: string,
  email: string,
  userType: ProjectUserType,
  role: ProjectTeamRole,
  avatarUrl?: string | null,
): TeamMemberDraft {
  return {
    id: newId("member"),
    firstName,
    lastName,
    email,
    userType,
    role,
    avatarUrl: avatarUrl ?? null,
  }
}

// Usuarios que ya pertenecen a otros proyectos de la empresa y pueden
// asignarse directamente. (Datos de ejemplo — reemplazar por la API real.)
export type AvailableTeamMember = {
  id: string
  firstName: string
  lastName: string
  email: string
  roleTitle: string
  userType: ProjectUserType
  role: ProjectTeamRole
  avatarUrl?: string | null
}

export const AVAILABLE_TEAM_MEMBERS: AvailableTeamMember[] = [
  { id: "avail-mf", firstName: "María", lastName: "Fernandez", email: "maria.fernandez@alamogrupo.com", roleTitle: "Director/a de Obra", userType: "Supervisor", role: "Director de Obra" },
  { id: "avail-dr", firstName: "Diego", lastName: "Ramirez", email: "diego.ramirez@alamogrupo.com", roleTitle: "Lider de proyecto", userType: "Supervisor", role: "Residente" },
  { id: "avail-pt", firstName: "Patricia", lastName: "Torres", email: "patricia.torres@alamogrupo.com", roleTitle: "Project Manager", userType: "Admin", role: "Residente" },
  { id: "avail-rs", firstName: "Roberto", lastName: "Silva", email: "roberto.silva@alamogrupo.com", roleTitle: "Contratista", userType: "Operador", role: "Residente" },
  { id: "avail-jl", firstName: "Jorge", lastName: "Lezcano", email: "jorge.lezcano@alamogrupo.com", roleTitle: "Capataz", userType: "Operador", role: "Residente" },
  { id: "avail-ag", firstName: "Alejandro", lastName: "Gomez", email: "alejandro.gomez@alamogrupo.com", roleTitle: "Capataz", userType: "Operador", role: "Residente" },
]

export function availableMemberInitials(member: AvailableTeamMember): string {
  return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase()
}

export function teamMemberFullName(member: TeamMemberDraft): string {
  return `${member.firstName} ${member.lastName}`.trim()
}

export function teamMemberInitials(member: TeamMemberDraft): string {
  const first = member.firstName.trim().charAt(0)
  const last = member.lastName.trim().charAt(0)
  const combined = `${first}${last}`.toUpperCase()
  if (combined.length >= 2) return combined
  const local = member.email.split("@")[0]?.trim() ?? ""
  return (local.slice(0, 2) || "??").toUpperCase()
}

const TEAM_ROLE_DISPLAY: Record<
  ProjectTeamRole,
  { badge: string; description: string }
> = {
  Founder: { badge: "Founder", description: "Founder" },
  "Director General": { badge: "Director", description: "Director General" },
  Desarrollador: { badge: "Dev", description: "Desarrollador" },
  Administrador: { badge: "Admin", description: "Administrador" },
  Gerente: { badge: "Gerente", description: "Gerente" },
  "Project Manager": { badge: "PM", description: "Project Manager" },
  Coordinador: { badge: "Coord.", description: "Coordinador" },
  "Director de Obra": { badge: "Dir. Obra", description: "Director de Obra" },
  Residente: { badge: "Residente", description: "Residente" },
  "Jefe de Obra": { badge: "Jefe Obra", description: "Jefe de Obra" },
  Supervisor: { badge: "Supervisor", description: "Supervisor" },
  "Lider de Proyecto": { badge: "Lider", description: "Lider de Proyecto" },
  Capataz: { badge: "Capataz", description: "Capataz" },
  Contratista: { badge: "Contratista", description: "Contratista" },
  Subcontratista: { badge: "Subcontrat.", description: "Subcontratista" },
  Cliente: { badge: "Cliente", description: "Cliente" },
}

export function getTeamRoleDisplay(role: ProjectTeamRole): {
  badge: string
  description: string
} {
  return TEAM_ROLE_DISPLAY[role]
}

export function countStructureUnits(floors: StructureFloorDraft[]): number {
  return floors.reduce((sum, floor) => sum + floor.units.length, 0)
}

export function createRubroGroup(name: string): RubroGroupDraft {
  return {
    id: newId("group"),
    name,
    rubros: [],
  }
}

export function createDefaultRubroItem(): RubroItemDraft {
  return {
    id: newId("rubro"),
    name: "",
    trackingType: "Porcentaje",
    tasks: [],
  }
}

export function createDefaultRubroTask(): RubroTaskDraft {
  return {
    id: newId("task"),
    name: "",
    weightPercent: "",
  }
}

export function countRubroTasks(rubros: RubroItemDraft[]): number {
  return rubros.reduce((sum, rubro) => sum + rubro.tasks.length, 0)
}

export function getGroupDisplayStats(group: RubroGroupDraft): {
  rubros: number
  tareas: number
} {
  if (
    group.seedRubrosCount !== undefined &&
    group.seedTasksCount !== undefined
  ) {
    return {
      rubros: group.seedRubrosCount,
      tareas: group.seedTasksCount,
    }
  }

  return {
    rubros: group.rubros.length,
    tareas: countRubroTasks(group.rubros),
  }
}
