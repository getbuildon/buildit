"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { EsqueletoDeInicio, PantallaDeInicio } from "@/components/inicio/PantallaDeInicio"
import {
  HOME_QUERY_STALE_MS,
  homeProgressIdsKey,
  homeQueryKeys,
} from "@/lib/home/homeQueryKeys"
import { getHomeShell, type HomeShellData } from "@/app/home/actions"
import { claves, FRESCO_MS } from "@/lib/api/claves"
import { apiDisponible } from "@/lib/api/navegador"
import type { Arranque, ProgresoDeInicio } from "@/lib/api/tipos"
import { useLectura } from "@/lib/api/useLectura"
import type { HomeProjectListItem } from "@/lib/projects/types"
import {
  getHomeProjectsProgress,
  listHomeProjects,
} from "@/lib/projects/listUserProjects"

/** Camino anterior (server actions de Next). Se usa mientras el ambiente no tenga servidor de datos. */
function HomeConServerActions() {
  const { user } = useAuth()
  const userId = user?.id ?? ""

  const shellQuery = useQuery({
    queryKey: homeQueryKeys.shell(userId),
    queryFn: getHomeShell,
    staleTime: HOME_QUERY_STALE_MS,
    gcTime: HOME_QUERY_STALE_MS,
    enabled: Boolean(userId),
  })

  const projectsQuery = useQuery({
    queryKey: homeQueryKeys.projects(userId),
    queryFn: listHomeProjects,
    staleTime: HOME_QUERY_STALE_MS,
    gcTime: HOME_QUERY_STALE_MS,
    enabled: Boolean(userId),
  })

  const projects = projectsQuery.data ?? []
  const projectIds = projects.map((project) => project.projectId)
  const progressIdsKey = homeProgressIdsKey(projectIds)

  const progressQuery = useQuery({
    queryKey: homeQueryKeys.progress(userId, progressIdsKey),
    queryFn: () => getHomeProjectsProgress(projectIds),
    staleTime: HOME_QUERY_STALE_MS,
    gcTime: HOME_QUERY_STALE_MS,
    refetchOnWindowFocus: false,
    enabled: Boolean(userId) && projectIds.length > 0,
  })

  return (
    <PantallaDeInicio
      email={user?.email}
      shell={shellQuery.data}
      shellPendiente={shellQuery.isPending}
      projects={projects}
      projectsPendiente={projectsQuery.isPending}
      progress={progressQuery.data}
      aviso={
        progressQuery.isError
          ? "No pudimos cargar el progreso de las obras. Probá de nuevo en un momento."
          : null
      }
      error={null}
    />
  )
}

function shellDesdeArranque(arranque: Arranque, email: string | undefined): HomeShellData {
  const firstName = arranque.persona.nombre?.trim() ?? ""
  const lastName = arranque.persona.apellido?.trim() ?? ""
  const empresas = arranque.empresas.map((e) => ({ id: e.id, name: e.nombre, role: e.rol }))
  const manageableCompanies = empresas.filter((e) => e.role === "owner" || e.role === "admin")
  const primary = empresas[0] ?? null
  return {
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`.trim() || email?.split("@")[0]?.trim() || "",
    avatarUrl: arranque.persona.avatarUrl,
    primaryCompany: primary ? { id: primary.id, name: primary.name } : null,
    manageableCompanies,
    canCreateProjects: manageableCompanies.length > 0,
    hasClientAccess: arranque.obras.some((obra) => obra.acceso.permisos.clientPortal === true),
    canSeeBackoffice: arranque.persona.veBackoffice,
  }
}

function obrasDesdeArranque(arranque: Arranque): HomeProjectListItem[] {
  return arranque.obras.map((obra) => ({
    projectId: obra.id,
    name: obra.nombre,
    address: obra.direccion ?? "Sin dirección",
    floors: obra.pisos,
    status: obra.estado as HomeProjectListItem["status"],
    companyLogoUrl: obra.empresa?.logoUrl ?? null,
  }))
}

/**
 * Camino nuevo: dos lecturas al servidor de datos, con copia en el dispositivo.
 * Abre al instante con lo guardado y funciona sin señal con lo último que se vio.
 */
function HomeConApi() {
  const { user } = useAuth()
  const userId = user?.id ?? ""

  const arranque = useLectura<Arranque>({
    clave: claves.arranque(userId),
    ruta: "/arranque",
    userId,
    frescoMs: FRESCO_MS.arranque,
  })
  const progreso = useLectura<ProgresoDeInicio>({
    clave: claves.progresoDeInicio(userId),
    ruta: "/inicio/progreso",
    userId,
    frescoMs: FRESCO_MS.progresoDeInicio,
  })

  const datos = arranque.data
  const progress = progreso.data
    ? Object.fromEntries(
        Object.entries(progreso.data.progreso).map(([id, p]) => [
          id,
          { generalProgressPercent: p.general, weeklyProgressDelta: p.semanal },
        ]),
      )
    : undefined

  const sinNada = !datos && arranque.isError
  const aviso =
    datos && (arranque.isError || progreso.isError)
      ? arranque.error?.status === 0 || progreso.error?.status === 0
        ? "Sin conexión. Estás viendo lo último que se guardó en este dispositivo."
        : "No pudimos actualizar los datos. Estás viendo lo último guardado."
      : null

  return (
    <PantallaDeInicio
      email={user?.email}
      shell={datos ? shellDesdeArranque(datos, user?.email) : undefined}
      shellPendiente={!datos}
      projects={datos ? obrasDesdeArranque(datos) : []}
      projectsPendiente={!datos}
      progress={progress}
      aviso={aviso}
      error={
        sinNada
          ? {
              mensaje: arranque.error?.message ?? "No pudimos cargar tus obras.",
              reintentar: () => {
                void arranque.refetch()
                void progreso.refetch()
              },
            }
          : null
      }
    />
  )
}

function HomePage() {
  return apiDisponible() ? <HomeConApi /> : <HomeConServerActions />
}

export default withAuth(HomePage, { cargando: <EsqueletoDeInicio /> })
