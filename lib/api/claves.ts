/**
 * Claves de las lecturas del servidor de datos. Un hecho, una clave: si dos pantallas
 * muestran lo mismo, usan la misma clave y se actualizan juntas.
 * Todas llevan a la persona: al cambiar de usuario no se mezcla nada.
 */
export const claves = {
  /** Persona, empresas y obras con permisos. Lo comparte toda la app. */
  arranque: (userId: string) => ["api", userId, "arranque"] as const,
  /** Avance general y semanal de cada obra (tarjetas del inicio). */
  progresoDeInicio: (userId: string) => ["api", userId, "inicio", "progreso"] as const,
  /** El resumen de una obra (Dashboard): avance por piso y por unidad, y los números. */
  resumenDeObra: (userId: string, obraId: string) => ["api", userId, "obras", obraId, "resumen"] as const,
  /** Trabajo diario: estructura, tareas y último avance de cada una (filas de la base). */
  trabajoDeObra: (userId: string, obraId: string) => ["api", userId, "obras", obraId, "trabajo"] as const,
  /** Certificaciones: completadas para certificar y ya certificadas (filas de la base). */
  certificacionesDeObra: (userId: string, obraId: string) => ["api", userId, "obras", obraId, "certificaciones"] as const,
  /** El detalle de una unidad: avance y tareas con su estado (filas de la base). */
  detalleDeUnidad: (userId: string, obraId: string, unidadId: string) =>
    ["api", userId, "obras", obraId, "unidades", unidadId] as const,
  /** Equipo de la obra (server action con copia en el dispositivo). */
  equipoDeObra: (userId: string, obraId: string) => ["api", userId, "obras", obraId, "equipo"] as const,
  /** Clientes de la obra (server action con copia en el dispositivo). */
  clientesDeObra: (userId: string, obraId: string) => ["api", userId, "obras", obraId, "clientes"] as const,
  /** Configuración de la obra (server action con copia en el dispositivo). */
  configuracionDeObra: (userId: string, obraId: string) => ["api", userId, "obras", obraId, "configuracion"] as const,
  /** Portal Clientes, lo que edita el equipo (server action con copia en el dispositivo). */
  portalDeObra: (userId: string, obraId: string) => ["api", userId, "obras", obraId, "portal"] as const,
  /** El detalle de un trabajo cargado (estado, comentarios, fotos, historial). */
  detalleDeAvance: (userId: string, obraId: string, avanceId: string) =>
    ["api", userId, "obras", obraId, "avances", avanceId] as const,
}

/** Cuánto vale cada lectura antes de volver a preguntarle al servidor. */
export const FRESCO_MS = {
  /** Cambia poco (alta de obra, cambio de rol). Igual se revalida al volver a la app. */
  arranque: 60_000,
  /** Cambia cuando alguien certifica. */
  progresoDeInicio: 60_000,
  /** Cambia cuando alguien carga o certifica un avance. */
  resumenDeObra: 60_000,
  /** Cambia cuando alguien carga o certifica un avance. */
  trabajoDeObra: 60_000,
  certificacionesDeObra: 60_000,
  detalleDeUnidad: 60_000,
  equipoDeObra: 60_000,
  clientesDeObra: 60_000,
  configuracionDeObra: 60_000,
  portalDeObra: 60_000,
  /** Los enlaces de las fotos valen una hora: se renuevan bastante antes. */
  detalleDeAvance: 5 * 60_000,
}
