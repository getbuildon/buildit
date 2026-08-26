"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { PerfilView } from "@/components/profile/PerfilView"
import { useProjectAccess } from "@/components/project-shell/ProjectAccessProvider"
import { useProjectMeta } from "@/components/project-shell/ProjectMetaProvider"
import { Spinner } from "@/components/ui/spinner"
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
import { DashboardMainView } from "./components/DashboardMainView"
import { UnitDetailView } from "./components/UnitDetailView"
import { CertificacionesView } from "./certificaciones/CertificacionesView"
import { getCertificacionesData } from "./certificaciones/actions"
import { ClientesView } from "./clientes/ClientesView"
import { getProjectClientsData } from "./clientes/actions"
import { getConfigPageData, getDashboardData } from "./configuracion/actions"
import { ConfiguracionView } from "./configuracion/ConfiguracionView"
import { EquipoTeamView } from "./equipo/EquipoTeamView"
import { getProjectTeamData } from "./equipo/actions"
import { getMiUnidadPageData } from "./mi-unidad/actions"
import { MiUnidadView } from "./mi-unidad/MiUnidadView"
import { getPortalClientesPageData } from "./portal-clientes/actions"
import { PortalClientesView } from "./portal-clientes/PortalClientesView"
import { getTrabajoDiarioData, type TrabajoDiarioData } from "./trabajo-diario/actions"
import { DashboardView } from "./trabajo-diario/DashboardView"
import { getUnitDetailData } from "./unidades/actions"

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

function SectionPending({ label = "Cargando…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="size-8 text-[#ff7433]" />
      <span className="sr-only">{label}</span>
    </div>
  )
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

  if (redirectTo) {
    return <SectionPending label="Redirigiendo…" />
  }

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
      return <PerfilView projectId={projectId} />
    case "unit":
      return <UnitSection projectId={projectId} unitId={route.unitId} />
    default:
      return <SectionError message="No encontramos esta sección." />
  }
}

function DashboardSection({ projectId }: { projectId: string }) {
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

  if (query.isPending) return <SectionPending />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar el dashboard." />
  }
  return (
    <DashboardMainView
      project={{ id: project.id, name: project.name }}
      dashboard={query.data}
    />
  )
}

function TrabajoDiarioSection({ projectId }: { projectId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.trabajoDiario(projectId),
    queryFn: async () => {
      const data = await getTrabajoDiarioData(projectId)
      return data ?? EMPTY_TRABAJO_DIARIO
    },
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <SectionPending />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar el trabajo diario." />
  }
  return <DashboardView projectId={projectId} data={query.data} />
}

function CertificacionesSection({ projectId }: { projectId: string }) {
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

  if (query.isPending) return <SectionPending />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar las certificaciones." />
  }
  return <CertificacionesView projectId={projectId} initialData={query.data} />
}

function EquipoSection({ projectId }: { projectId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.equipo(projectId),
    queryFn: () => getProjectTeamData(projectId),
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <SectionPending />
  if (query.isError) {
    return (
      <SectionError
        message={
          query.error instanceof Error
            ? query.error.message
            : "No pudimos cargar el equipo."
        }
      />
    )
  }
  if (!query.data) return <SectionError message="No pudimos cargar el equipo." />
  return <EquipoTeamView projectId={projectId} initialData={query.data} />
}

function ClientesSection({ projectId }: { projectId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.clientes(projectId),
    queryFn: () => getProjectClientsData(projectId),
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <SectionPending />
  if (query.isError) {
    return (
      <SectionError
        message={
          query.error instanceof Error
            ? query.error.message
            : "No pudimos cargar los clientes."
        }
      />
    )
  }
  if (!query.data) return <SectionError message="No pudimos cargar los clientes." />
  return <ClientesView projectId={projectId} initialData={query.data} />
}

function ConfiguracionSection({ projectId }: { projectId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.configuracion(projectId),
    queryFn: async () => {
      const data = await getConfigPageData(projectId)
      if (!data) throw new Error("empty")
      return data
    },
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <SectionPending />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar la configuración." />
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

function PortalClientesSection({ projectId }: { projectId: string }) {
  const query = useQuery({
    queryKey: projectQueryKeys.portal(projectId),
    queryFn: () => getPortalClientesPageData(projectId),
    staleTime: PROJECT_QUERY_STALE_MS,
    gcTime: PROJECT_QUERY_GC_MS,
  })

  if (query.isPending) return <SectionPending />
  if (query.isError) {
    return (
      <SectionError
        message={
          query.error instanceof Error
            ? query.error.message
            : "No pudimos cargar el portal de clientes."
        }
      />
    )
  }
  if (!query.data) {
    return <SectionError message="No pudimos cargar el portal de clientes." />
  }
  return (
    <PortalClientesView
      projectId={projectId}
      initialData={query.data.data}
      previewContext={query.data.previewContext}
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

  if (query.isPending) return <SectionPending />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar tu unidad." />
  }
  const { greetingName, ...pageData } = query.data
  return (
    <MiUnidadView
      projectId={projectId}
      data={pageData}
      greetingName={greetingName}
    />
  )
}

function UnitSection({ projectId, unitId }: { projectId: string; unitId: string }) {
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

  if (query.isPending) return <SectionPending />
  if (query.isError || !query.data) {
    return <SectionError message="No encontramos esta unidad." />
  }
  return <UnitDetailView projectId={projectId} data={query.data} />
}
