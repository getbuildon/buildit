/** Jerarquía visual: grupo → rubro → tarea (3 “mundos” de color). */
export const RUBRO_STRUCTURE_COLORS = {
  /** Borde activo (nivel abierto o enfocado). */
  borderActive: "#cad5e2",
  /** Borde en reposo (colapsado). */
  borderRest: "#e2e8f0",

  /** Nivel 1 — Grupo de rubros (cálido, ancla naranja). */
  groupHeaderOpen: "#fff6f1",
  groupHeaderRest: "#ffffff",
  groupCanvas: "#fefcfb",

  /** Nivel 2 — Rubro (crema sobre el lienzo del grupo). */
  rubroSurface: "#fefcfb",
  rubroTasksCanvas: "#ffffff",

  /** Nivel 3 — Tarea (neutro frío, hoja del árbol). */
  taskSurface: "#f8fafc",
  taskBorder: "#e2e8f0",
} as const

export const RUBRO_STRUCTURE_SHADOW = "0 0 7.5px rgba(0, 0, 0, 0.05)" as const

/** @deprecated Usar RUBRO_STRUCTURE_COLORS.borderActive */
export const RUBRO_STRUCTURE_BORDER = RUBRO_STRUCTURE_COLORS.borderActive
