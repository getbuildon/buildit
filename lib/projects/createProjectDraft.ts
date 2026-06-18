export const STRUCTURE_UNIT_TYPES = [
  "Departamento",
  "Cochera",
  "Local",
  "Bodega",
] as const

export type StructureUnitType = (typeof STRUCTURE_UNIT_TYPES)[number]

export type StructureUnitDraft = {
  id: string
  type: StructureUnitType
  squareMeters: string
  roomCount: string
}

export type StructureFloorDraft = {
  id: string
  name: string
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
  "Interno",
  "Externo",
  "Cliente",
  "Contratista",
] as const

export type ProjectUserType = (typeof PROJECT_USER_TYPES)[number]

export const PROJECT_TEAM_ROLES = [
  "Administrador",
  "Director de Obra",
  "Residente de Obra",
  "Arquitecto",
  "Cliente",
] as const

export type ProjectTeamRole = (typeof PROJECT_TEAM_ROLES)[number]

export type TeamMemberDraft = {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: ProjectUserType
  role: ProjectTeamRole
}

export type CreateProjectDraft = {
  projectName: string
  location: string
  startDate: string
  endDate: string
  floors: StructureFloorDraft[]
  groups: RubroGroupDraft[]
  teamMembers: TeamMemberDraft[]
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function createDefaultUnit(): StructureUnitDraft {
  return {
    id: newId("unit"),
    type: "Departamento",
    squareMeters: "",
    roomCount: "",
  }
}

export function createDefaultFloor(floorIndex: number): StructureFloorDraft {
  return {
    id: newId("floor"),
    name: `Piso ${floorIndex}`,
    level: "",
    units: [],
  }
}

function createDemoCercoObraRubro(): RubroItemDraft {
  return {
    id: newId("rubro"),
    name: "Cerco de Obra",
    trackingType: "Porcentaje",
    tasks: [
      {
        id: newId("task"),
        name: "Instalación de cerco perimetral",
        weightPercent: "",
      },
      {
        id: newId("task"),
        name: "Portón de acceso vehicular",
        weightPercent: "",
      },
      {
        id: newId("task"),
        name: "Señalización de seguridad",
        weightPercent: "",
      },
    ],
  }
}

export function createTemplateRubroGroups(): RubroGroupDraft[] {
  return [
    {
      id: newId("group"),
      name: "Trabajos Preliminares",
      rubros: [createDemoCercoObraRubro()],
      seedRubrosCount: 6,
      seedTasksCount: 20,
    },
    { id: newId("group"), name: "Obra Gruesa", rubros: [], seedRubrosCount: 9, seedTasksCount: 32 },
    { id: newId("group"), name: "Instalaciones Sanitarias", rubros: [], seedRubrosCount: 7, seedTasksCount: 26 },
    { id: newId("group"), name: "Instalaciones Eléctricas", rubros: [], seedRubrosCount: 12, seedTasksCount: 39 },
    { id: newId("group"), name: "Obra Fina", rubros: [], seedRubrosCount: 12, seedTasksCount: 46 },
  ]
}

export function createEmptyProjectDraft(): CreateProjectDraft {
  return {
    projectName: "",
    location: "",
    startDate: "",
    endDate: "",
    floors: [],
    groups: createTemplateRubroGroups(),
    teamMembers: [],
  }
}

export function createTeamMemberDraft(
  firstName: string,
  lastName: string,
  email: string,
  userType: ProjectUserType,
  role: ProjectTeamRole,
): TeamMemberDraft {
  return {
    id: newId("member"),
    firstName,
    lastName,
    email,
    userType,
    role,
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
}

export const AVAILABLE_TEAM_MEMBERS: AvailableTeamMember[] = [
  { id: "avail-mf", firstName: "María", lastName: "Fernandez", email: "maria.fernandez@alamogrupo.com", roleTitle: "Director/a de Obra", userType: "Interno", role: "Director de Obra" },
  { id: "avail-dr", firstName: "Diego", lastName: "Ramirez", email: "diego.ramirez@alamogrupo.com", roleTitle: "Lider de proyecto", userType: "Interno", role: "Residente de Obra" },
  { id: "avail-pt", firstName: "Patricia", lastName: "Torres", email: "patricia.torres@alamogrupo.com", roleTitle: "Project Manager", userType: "Interno", role: "Residente de Obra" },
  { id: "avail-rs", firstName: "Roberto", lastName: "Silva", email: "roberto.silva@alamogrupo.com", roleTitle: "Contratista", userType: "Contratista", role: "Residente de Obra" },
  { id: "avail-jl", firstName: "Jorge", lastName: "Lezcano", email: "jorge.lezcano@alamogrupo.com", roleTitle: "Capataz", userType: "Interno", role: "Residente de Obra" },
  { id: "avail-ag", firstName: "Alejandro", lastName: "Gomez", email: "alejandro.gomez@alamogrupo.com", roleTitle: "Capataz", userType: "Interno", role: "Residente de Obra" },
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
  Administrador: { badge: "Admin", description: "Administrador" },
  "Director de Obra": { badge: "Supervisor", description: "Director de obra" },
  "Residente de Obra": { badge: "Residente", description: "Residente de obra" },
  Arquitecto: { badge: "Arquitecto", description: "Arquitecto" },
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
