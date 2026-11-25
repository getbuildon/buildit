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
}

/** Cuánto vale cada lectura antes de volver a preguntarle al servidor. */
export const FRESCO_MS = {
  /** Cambia poco (alta de obra, cambio de rol). Igual se revalida al volver a la app. */
  arranque: 60_000,
  /** Cambia cuando alguien certifica. */
  progresoDeInicio: 60_000,
}
