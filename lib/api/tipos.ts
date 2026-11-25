/** Formas de las respuestas del servidor de datos (espejo de buildon-api/src/rutas). */
export type ValorDePermiso = boolean | "unitOnly"

export type AccesoAObra = {
  tipo: "owner" | "admin" | "supervisor" | "operador" | "cliente"
  permisos: Record<string, ValorDePermiso>
  /** null = todas las unidades; lista = solo esas (cliente). */
  unidades: string[] | null
}

export type ObraDelArranque = {
  id: string
  nombre: string
  direccion: string | null
  estado: string
  pisos: number
  empresa: { id: string; nombre: string; logoUrl: string | null } | null
  portadaUrl: string | null
  acceso: AccesoAObra
}

export type Arranque = {
  persona: {
    id: string
    email: string | null
    nombre: string | null
    apellido: string | null
    avatarUrl: string | null
    veBackoffice: boolean
  }
  empresas: { id: string; nombre: string; logoUrl: string | null; rol: string }[]
  obras: ObraDelArranque[]
}

export type ProgresoDeInicio = {
  progreso: Record<string, { general: number; semanal: number }>
}
