/** Formas de las respuestas del servidor de datos (espejo de buildon-api/src/rutas). */
import type { CrudosDeCertificaciones } from "@/lib/projects/armarCertificaciones"
import type { FilaDeAvance, FilaDeGrupo, FilaDePiso, FilaDeUnidad } from "@/lib/projects/armarTrabajoDiario"

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
  /** El rol en el equipo de la obra («Director de obra»), si es parte del equipo. */
  rol?: string | null
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

/** GET /obras/:id/resumen. Espejo de src/dominio/resumen.ts del servidor de datos. */
export type ResumenDeObraApi = {
  pisos: {
    id: string
    nombre: string
    identificador: string | null
    avance: number
    unidades: {
      id: string
      codigo: string
      nombre: string | null
      tipo: string | null
      ambientes: number | null
      avance: number
      bloqueada: boolean
    }[]
  }[]
  numeros: {
    pisos: number
    unidades: number
    avance: number
    terminadas: number
    certificadas: number
    certificadasEstaSemana: number
    bloqueadas: number
  }
}

/**
 * GET /obras/:id/trabajo. Las filas de la base tal cual; la app las arma con
 * lib/projects/armarTrabajoDiario.ts (la misma función que la server action).
 */
export type TrabajoDeObraApi = {
  pisos: FilaDePiso[]
  unidades: FilaDeUnidad[]
  grupos: FilaDeGrupo[]
  asignaciones: Record<string, string[]>
  avances: FilaDeAvance[]
}

/** GET /obras/:id/certificaciones. Filas de la base; la app las arma con lib/projects/armarCertificaciones.ts. */
export type CertificacionesDeObraApi = {
  pisos: CrudosDeCertificaciones["floors"]
  unidades: CrudosDeCertificaciones["units"]
  grupos: CrudosDeCertificaciones["rubroGroups"]
  asignaciones: Record<string, string[]>
  avances: CrudosDeCertificaciones["entries"]
  validaciones: CrudosDeCertificaciones["validations"]
  nombres: Record<string, string>
  puedeCertificar: boolean
}
