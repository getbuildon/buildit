"use client"

import { useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContextSupabase"
import { claves, FRESCO_MS } from "@/lib/api/claves"
import { apiDisponible } from "@/lib/api/navegador"
import type { CertificacionesDeObraApi, ResumenDeObraApi, TrabajoDeObraApi } from "@/lib/api/tipos"
import { useLectura } from "@/lib/api/useLectura"
import { useColaDeObra } from "@/lib/api/useColaDeObra"
import { certificacionesDeLaCola, conLaCola, pendientesDeLaCola } from "@/lib/projects/colaDeTrabajo"
import type { DashboardFloor, DashboardStats } from "./configuracion/actions"
import { useRouter } from "next/navigation"
import { MiPerfil } from "@/components/perfil/MiPerfil"
import { useProjectAccess } from "@/components/project-shell/ProjectAccessProvider"
import { useProjectMeta } from "@/components/project-shell/ProjectMetaProvider"
import {
  parseTenantSection,
  tenantRouteRedirectHref,
  type TenantRoute,
} from "@/lib/project/tenantSection"
import {
  PROJECT_QUERY_GC_MS,
  PROJECT_QUERY_STALE_MS,
  projectQueryKeys,
} from "@/lib/project/projectQueryKeys"
import { ResumenDeObra, ResumenDeObraCargando, ResumenDeObraError } from "@/components/obra/ResumenDeObra"
import { DetalleDeUnidad, DetalleDeUnidadCargando, DetalleDeUnidadError } from "@/components/obra/DetalleDeUnidad"
import { armarDetalleDeUnidad, type CrudosDelDetalleDeUnidad } from "@/lib/projects/armarDetalleDeUnidad"
import { Certificaciones, CertificacionesCargando, CertificacionesError } from "@/components/obra/Certificaciones"
import { armarCertificaciones } from "@/lib/projects/armarCertificaciones"
import { getCertificacionesData } from "./certificaciones/actions"
import { Clientes, ClientesCargando, ClientesError } from "@/components/obra/Clientes"
import { useLecturaConCopia } from "@/lib/api/useLecturaConCopia"
import { getProjectClientsData } from "./clientes/actions"
import { getConfigPageData, getDashboardData } from "./configuracion/actions"
import { ConfiguracionView } from "./configuracion/ConfiguracionView"
import { Equipo, EquipoCargando, EquipoError } from "@/components/obra/Equipo"
import { getProjectTeamData } from "./equipo/actions"
import { getMiUnidadPageData } from "./mi-unidad/actions"
import { MiUnidad, MiUnidadCargando, MiUnidadError } from "@/components/obra/MiUnidad"
import { getPortalClientesPageData } from "./portal-clientes/actions"
import { PortalClientes, PortalClientesCargando, PortalClientesError } from "@/components/obra/PortalClientes"
import { getTrabajoDiarioData, type TrabajoDiarioData } from "./trabajo-diario/actions"
import { TrabajoDiario, TrabajoDiarioCargando, TrabajoDiarioError } from "@/components/obra/TrabajoDiario"
import { armarTrabajoDiario, type DatosCrudosDeTrabajo } from "@/lib/projects/armarTrabajoDiario"
import { getUnitDetailData } from "./unidades/actions"
import { ConfiguracionSectionsSkeleton } from "./configuracion/ConfiguracionSectionsSkeleton"
import { Skeleton } from "@/library/atoms/skeleton/Skeleton"

type ProjectTenantAppProps = {
  projectId: string
  section?: string[]
}

const EMPTY_TRABAJO_DIARIO: TrabajoDiarioData = {
  floors: [],
  tasks: [],
  rubroGroups: [],
  assignmentsByUnit: {},
  loadedUnitTaskKeys: [],
  unitTaskStatuses: {},
}

function SectionError({ message }: { message: string }) {
  return (
    <p className="py-10 text-center text-sm text-[#777b84]">{message}</p>
  )
}

export function ProjectTenantApp({ projectId, section }: ProjectTenantAppProps) {
  const access = useProjectAccess()
  const router = useRouter()
  const route = parseTenantSection(section)
  const redirectTo = tenantRouteRedirectHref(access, projectId, route)

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo)
    }
  }, [redirectTo, router])

  // Se está yendo a otra sección: nada en el medio (sin «Redirigiendo…»).
  if (redirectTo) return null

  return <TenantSection projectId={projectId} route={route} />
}

function TenantSection({
  projectId,
  route,
}: {
  projectId: string
  route: TenantRoute
}) {
  switch (route.type) {
    case "dashboard":
      return <DashboardSection projectId={projectId} />
    case "section":
      switch (route.segment) {
        case "trabajo-diario":
          return <TrabajoDiarioSection projectId={projectId} />
        case "certificaciones":
          return <CertificacionesSection projectId={projectId} />
        case "equipo":
          return <EquipoSection projectId={projectId} />
        case "clientes":
          return <ClientesSection projectId={projectId} />
        case "configuracion":
          return <ConfiguracionSection projectId={projectId} />
        case "portal-clientes":
          return <PortalClientesSection projectId={projectId} />
        default:
          return <SectionError message="No encontramos esta sección." />
      }
    case "mi-unidad":
      return <MiUnidadSection projectId={projectId} />
    case "perfil":
      return <MiPerfil projectId={projectId} />
    case "unit":
      return <UnitSection projectId={projectId} unitId={route.unitId} />
    default:
      return <SectionError message="No encontramos esta sección." />
  }
}

function DashboardSection({ projectId }: { projectId: string }) {
  return apiDisponible() ? (
    <DashboardConApi projectId={projectId} />
  ) : (
    <DashboardConServerActions projectId={projectId} />
  )
}

function dashboardDesdeApi(resumen: ResumenDeObraApi): {
  floors: DashboardFloor[]
  stats: DashboardStats
} {
  return {
    floors: resumen.pisos.map((piso) => ({
      id: piso.id,
      name: piso.nombre,
      identifier: piso.identificador,
      progress: piso.avance,
      units: piso.unidades.map((u) => ({
        id: u.id,
        code: u.codigo,
        name: u.nombre,
        unit_type: u.tipo,
        room_count: u.ambientes,
        progress: u.avance,
        hasBlockedTasks: u.bloqueada,
      })),
    })),
    stats: {
      totalFloors: resumen.numeros.pisos,
      totalUnits: resumen.numeros.unidades,
      generalProgress: resumen.numeros.avance,
      completedUnits: resumen.numeros.terminadas,
      certifiedTasks: resumen.numeros.certificadas,
      certifiedTasksThisWeek: resumen.numeros.certificadasEstaSemana,
      blockedTasks: resumen.numeros.bloqueadas,
    },
  }
}

/**
 * Camino nuevo: el servidor de datos, con copia en el dispositivo. Abre al instante con
 * lo último guardado y, sin señal, lo sigue mostrando con un aviso.
 */
function DashboardConApi({ projectId }: { projectId: string }) {
  const project = useProjectMeta()
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const resumen = useLectura<ResumenDeObraApi>({
    clave: claves.resumenDeObra(userId, projectId),
    ruta: `/obras/${projectId}/resumen`,
    userId,
    frescoMs: FRESCO_MS.resumenDeObra,
  })

  if (!resumen.data) {
    if (resumen.isError) return <ResumenDeObraError reintentar={() => void resumen.refetch()} />
    return <ResumenDeObraCargando />
  }
  const aviso = resumen.isError ? avisoDeCopia(resumen.error) : null
  return (
    <ResumenDeObra
      project={{ id: project.id, name: project.name }}
      dashboard={dashboardDesdeApi(resumen.data)}
      aviso={aviso}
    />
  )
}

/** Camino anterior (server actions de Next), mientras el ambiente no tenga servidor de datos. */
function DashboardConServerActions({ projectId }: { projectId: string }) {
  const project = useProjectMeta()
  const query = useQuery({
    queryKey: projectQueryKeys.dashboard(projectId),
    queryFn: async () => {
      const dashboard = await getDashboardData(projectId)
      if (!dashboard) throw new Error("empty")
      return dashboard
    },
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <ResumenDeObraCargando />
  if (query.isError || !query.data) {
    return <ResumenDeObraError reintentar={() => void query.refetch()} />
  }
  return (
    <ResumenDeObra
      project={{ id: project.id, name: project.name }}
      dashboard={query.data}
    />
  )
}

/** El aviso cuando se muestra lo guardado porque no se pudo actualizar. */
function avisoDeCopia(error: { status: number } | null | undefined): string {
  return error?.status === 0
    ? "Sin conexión. Estás viendo lo último que se guardó en este dispositivo."
    : "No pudimos actualizar los datos. Estás viendo lo último guardado."
}

function TrabajoDiarioSection({ projectId }: { projectId: string }) {
  return apiDisponible() ? (
    <TrabajoDiarioConApi projectId={projectId} />
  ) : (
    <TrabajoDiarioConServerActions projectId={projectId} />
  )
}

/** Camino nuevo: las filas del servidor de datos, con copia en el dispositivo. */
function TrabajoDiarioConApi({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const trabajo = useLectura<TrabajoDeObraApi>({
    clave: claves.trabajoDeObra(userId, projectId),
    ruta: `/obras/${projectId}/trabajo`,
    userId,
    frescoMs: FRESCO_MS.trabajoDeObra,
  })
  const crudos = trabajo.data
  // Lo cargado que todavía no llegó al servidor se muestra igual, marcado «Sin enviar».
  const cola = useColaDeObra(userId, projectId)
  // Se arma con la misma función que el camino viejo; solo se rehace si cambian las filas.
  const data = useMemo(
    () =>
      crudos
        ? armarTrabajoDiario({
            floors: crudos.pisos,
            units: crudos.unidades,
            rubroGroups: crudos.grupos,
            assignmentsByUnit: crudos.asignaciones,
            entries: conLaCola(crudos.avances, cola),
          } satisfies DatosCrudosDeTrabajo)
        : null,
    [crudos, cola],
  )
  const pendientes = useMemo(() => pendientesDeLaCola(cola), [cola])

  if (!data) {
    if (trabajo.isError) return <TrabajoDiarioError reintentar={() => void trabajo.refetch()} />
    return <TrabajoDiarioCargando />
  }
  return (
    <TrabajoDiario
      projectId={projectId}
      data={data}
      pendientes={pendientes}
      aviso={trabajo.isError ? avisoDeCopia(trabajo.error) : null}
    />
  )
}

/** Camino anterior (server actions de Next), mientras el ambiente no tenga servidor de datos. */
function TrabajoDiarioConServerActions({ projectId }: { projectId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.trabajoDiario(projectId),
    queryFn: async () => {
      const data = await getTrabajoDiarioData(projectId)
      return data ?? EMPTY_TRABAJO_DIARIO
    },
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <TrabajoDiarioCargando />
  if (query.isError || !query.data) {
    return <TrabajoDiarioError reintentar={() => void query.refetch()} />
  }
  return <TrabajoDiario projectId={projectId} data={query.data} />
}

function CertificacionesSection({ projectId }: { projectId: string }) {
  return apiDisponible() ? (
    <CertificacionesConApi projectId={projectId} />
  ) : (
    <CertificacionesConServerActions projectId={projectId} />
  )
}

/** Camino nuevo: filas del servidor de datos con copia; lo de la cola se ve al instante. */
function CertificacionesConApi({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const lectura = useLectura<CertificacionesDeObraApi>({
    clave: claves.certificacionesDeObra(userId, projectId),
    ruta: `/obras/${projectId}/certificaciones`,
    userId,
    frescoMs: FRESCO_MS.certificacionesDeObra,
  })
  const cola = useColaDeObra(userId, projectId)
  const crudos = lectura.data
  const data = useMemo(
    () =>
      crudos
        ? armarCertificaciones(
            {
              floors: crudos.pisos,
              units: crudos.unidades,
              rubroGroups: crudos.grupos,
              assignmentsByUnit: crudos.asignaciones,
              entries: conLaCola(crudos.avances, cola),
              validations: [...certificacionesDeLaCola(cola), ...crudos.validaciones],
              nombres: crudos.nombres,
            },
            crudos.puedeCertificar,
            new Date(),
          )
        : null,
    [crudos, cola],
  )
  const pendientes = useMemo(() => pendientesDeLaCola(cola), [cola])

  if (!data) {
    if (lectura.isError) return <CertificacionesError reintentar={() => void lectura.refetch()} />
    return <CertificacionesCargando />
  }
  return (
    <Certificaciones
      projectId={projectId}
      data={data}
      pendientes={pendientes}
      aviso={lectura.isError ? avisoDeCopia(lectura.error) : null}
    />
  )
}

/** Camino anterior (server actions de Next), mientras el ambiente no tenga servidor de datos. */
function CertificacionesConServerActions({ projectId }: { projectId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.certificaciones(projectId),
    queryFn: async () => {
      const data = await getCertificacionesData(projectId)
      if (!data) throw new Error("empty")
      return data
    },
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <CertificacionesCargando />
  if (query.isError || !query.data) {
    return <CertificacionesError reintentar={() => void query.refetch()} />
  }
  return <Certificaciones projectId={projectId} data={query.data} />
}

/** Equipo: la misma lectura de siempre, con copia en el dispositivo (se ve sin señal). */
function EquipoSection({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const query = useLecturaConCopia({
    clave: claves.equipoDeObra(user?.id ?? "", projectId),
    leer: () => getProjectTeamData(projectId),
    userId: user?.id ?? "",
    frescoMs: FRESCO_MS.equipoDeObra,
  })

  if (!query.data) {
    if (query.isError) return <EquipoError reintentar={() => void query.refetch()} />
    return <EquipoCargando />
  }
  return (
    <Equipo projectId={projectId} data={query.data} aviso={query.isError ? avisoDeCopia(query.error) : null} />
  )
}

/** Clientes: la misma lectura de siempre, con copia en el dispositivo (se ve sin señal). */
function ClientesSection({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const query = useLecturaConCopia({
    clave: claves.clientesDeObra(user?.id ?? "", projectId),
    leer: () => getProjectClientsData(projectId),
    userId: user?.id ?? "",
    frescoMs: FRESCO_MS.clientesDeObra,
  })

  if (!query.data) {
    if (query.isError) return <ClientesError reintentar={() => void query.refetch()} />
    return <ClientesCargando />
  }
  return (
    <Clientes
      projectId={projectId}
      data={query.data}
      aviso={query.isError ? avisoDeCopia(query.error) : null}
    />
  )
}

/** Configuración: la misma lectura de siempre, con copia en el dispositivo (se ve sin señal). */
function ConfiguracionSection({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const query = useLecturaConCopia({
    clave: claves.configuracionDeObra(user?.id ?? "", projectId),
    leer: async () => {
      const data = await getConfigPageData(projectId)
      if (!data) throw new Error("No pudimos cargar la configuración.")
      return data
    },
    userId: user?.id ?? "",
    frescoMs: FRESCO_MS.configuracionDeObra,
  })

  if (!query.data) {
    if (query.isError) return <SectionError message="No pudimos cargar la configuración." />
    return (
      <div role="status" aria-busy className="flex flex-col gap-group py-compact sm:gap-block sm:py-block">
        <span className="sr-only">Cargando la configuración…</span>
        <Skeleton className="h-9 w-72 max-w-full" />
        <ConfiguracionSectionsSkeleton />
      </div>
    )
  }
  return (
    <ConfiguracionView
      project={query.data.project}
      planSurfaceMaxM2={query.data.planSurfaceMaxM2}
      initialFloors={query.data.floors}
      initialUnits={query.data.units}
      initialGroups={query.data.groups}
      initialAssignmentsByUnit={query.data.assignments.byUnit}
    />
  )
}

/** Portal Clientes (lo edita el equipo): la lectura de siempre, con copia en el dispositivo. */
function PortalClientesSection({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const query = useLecturaConCopia({
    clave: claves.portalDeObra(user?.id ?? "", projectId),
    leer: () => getPortalClientesPageData(projectId),
    userId: user?.id ?? "",
    frescoMs: FRESCO_MS.portalDeObra,
  })

  if (!query.data) {
    if (query.isError) return <PortalClientesError reintentar={() => void query.refetch()} />
    return <PortalClientesCargando />
  }
  return (
    <PortalClientes
      projectId={projectId}
      initialData={query.data.data}
      previewContext={query.data.previewContext}
      aviso={query.isError ? avisoDeCopia(query.error) : null}
    />
  )
}

function MiUnidadSection({ projectId }: { projectId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.miUnidad(projectId),
    queryFn: async () => {
      const data = await getMiUnidadPageData(projectId)
      if (!data) throw new Error("empty")
      return data
    },
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <MiUnidadCargando />
  if (query.isError || !query.data) {
    return <MiUnidadError reintentar={() => void query.refetch()} />
  }
  const { greetingName, ...pageData } = query.data
  return (
    <MiUnidad
      projectId={projectId}
      data={pageData}
      greetingName={greetingName}
    />
  )
}

function UnitSection({ projectId, unitId }: { projectId: string; unitId: string }) {
  return apiDisponible() ? (
    <UnitConApi projectId={projectId} unitId={unitId} />
  ) : (
    <UnitConServerActions projectId={projectId} unitId={unitId} />
  )
}

/** Camino nuevo: filas del servidor de datos con copia; lo de la cola se ve al instante. */
function UnitConApi({ projectId, unitId }: { projectId: string; unitId: string }) {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const lectura = useLectura<CrudosDelDetalleDeUnidad>({
    clave: claves.detalleDeUnidad(userId, projectId, unitId),
    ruta: `/obras/${projectId}/unidades/${unitId}`,
    userId,
    frescoMs: FRESCO_MS.detalleDeUnidad,
  })
  const cola = useColaDeObra(userId, projectId)
  const crudos = lectura.data
  const data = useMemo(
    () =>
      crudos
        ? armarDetalleDeUnidad({
            ...crudos,
            avances: conLaCola(crudos.avances, cola),
            validaciones: [...certificacionesDeLaCola(cola), ...crudos.validaciones],
          })
        : null,
    [crudos, cola],
  )
  const pendientes = useMemo(() => pendientesDeLaCola(cola), [cola])

  if (!data) {
    if (lectura.isError) return <DetalleDeUnidadError reintentar={() => void lectura.refetch()} />
    return <DetalleDeUnidadCargando />
  }
  return (
    <DetalleDeUnidad
      projectId={projectId}
      data={data}
      pendientes={pendientes}
      aviso={lectura.isError ? avisoDeCopia(lectura.error) : null}
    />
  )
}

/** Camino anterior (server actions de Next), mientras el ambiente no tenga servidor de datos. */
function UnitConServerActions({ projectId, unitId }: { projectId: string; unitId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.unit(projectId, unitId),
    queryFn: async () => {
      const data = await getUnitDetailData(projectId, unitId)
      if (!data) throw new Error("empty")
      return data
    },
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <DetalleDeUnidadCargando />
  if (query.isError || !query.data) return <DetalleDeUnidadError reintentar={() => void query.refetch()} />
  return <DetalleDeUnidad projectId={projectId} data={query.data} />
}
