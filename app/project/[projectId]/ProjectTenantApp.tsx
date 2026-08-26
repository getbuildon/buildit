"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PerfilView } from "@/components/profile/PerfilView"
import { useProjectAccess } from "@/components/project-shell/ProjectAccessProvider"
import { Spinner } from "@/components/ui/spinner"
import { getProfileData } from "@/app/project/[projectId]/perfil/actions"
import { toSidebarUserProfile } from "@/lib/profile/sidebarUserProfile"
import {
  parseTenantSection,
  tenantRouteRedirectHref,
  type TenantRoute,
} from "@/lib/project/tenantSection"
import { getProjectPlanSurfaceLimit } from "@/lib/projects/getProjectPlanSurfaceLimit"
import { DashboardMainView } from "./components/DashboardMainView"
import { UnitDetailView } from "./components/UnitDetailView"
import { CertificacionesView } from "./certificaciones/CertificacionesView"
import { getCertificacionesData } from "./certificaciones/actions"
import { ClientesView } from "./clientes/ClientesView"
import { getProjectClientsData } from "./clientes/actions"
import {
  getDashboardData,
  getProjectBasics,
} from "./configuracion/actions"
import { ConfiguracionView } from "./configuracion/ConfiguracionView"
import { EquipoTeamView } from "./equipo/EquipoTeamView"
import { getProjectTeamData } from "./equipo/actions"
import { getMiUnidadPageData } from "./mi-unidad/actions"
import { MiUnidadView } from "./mi-unidad/MiUnidadView"
import {
  getPortalClientesData,
  getPortalClientesPreviewContext,
} from "./portal-clientes/actions"
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

  return (
    <TenantSection
      key={section?.join("/") ?? ""}
      projectId={projectId}
      route={route}
    />
  )
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
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | {
        status: "ready"
        project: NonNullable<Awaited<ReturnType<typeof getProjectBasics>>>
        dashboard: Awaited<ReturnType<typeof getDashboardData>>
      }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void Promise.all([getProjectBasics(projectId), getDashboardData(projectId)])
      .then(([project, dashboard]) => {
        if (cancelled) return
        if (!project) {
          setState({ status: "error" })
          return
        }
        setState({ status: "ready", project, dashboard })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") {
    return <SectionError message="No pudimos cargar el dashboard." />
  }
  return <DashboardMainView project={state.project} dashboard={state.dashboard} />
}

function TrabajoDiarioSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | {
        status: "ready"
        project: NonNullable<Awaited<ReturnType<typeof getProjectBasics>>>
        data: TrabajoDiarioData
      }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void Promise.all([getProjectBasics(projectId), getTrabajoDiarioData(projectId)])
      .then(([project, data]) => {
        if (cancelled) return
        if (!project) {
          setState({ status: "error" })
          return
        }
        setState({ status: "ready", project, data: data ?? EMPTY_TRABAJO_DIARIO })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") {
    return <SectionError message="No pudimos cargar el trabajo diario." />
  }
  return <DashboardView project={state.project} data={state.data} />
}

function CertificacionesSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; data: NonNullable<Awaited<ReturnType<typeof getCertificacionesData>>> }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void getCertificacionesData(projectId)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setState({ status: "error" })
          return
        }
        setState({ status: "ready", data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") {
    return <SectionError message="No pudimos cargar las certificaciones." />
  }
  return <CertificacionesView projectId={projectId} initialData={state.data} />
}

function EquipoSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; data: Awaited<ReturnType<typeof getProjectTeamData>> }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void getProjectTeamData(projectId)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "No pudimos cargar el equipo.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") return <SectionError message={state.message} />
  return <EquipoTeamView projectId={projectId} initialData={state.data} />
}

function ClientesSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; data: Awaited<ReturnType<typeof getProjectClientsData>> }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void getProjectClientsData(projectId)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "No pudimos cargar los clientes.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") return <SectionError message={state.message} />
  return <ClientesView projectId={projectId} initialData={state.data} />
}

function ConfiguracionSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | {
        status: "ready"
        project: NonNullable<Awaited<ReturnType<typeof getProjectBasics>>>
        planSurfaceMaxM2: number | null
      }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      getProjectBasics(projectId),
      getProjectPlanSurfaceLimit(projectId),
    ])
      .then(([project, planSurfaceMaxM2]) => {
        if (cancelled) return
        if (!project) {
          setState({ status: "error" })
          return
        }
        setState({ status: "ready", project, planSurfaceMaxM2 })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") {
    return <SectionError message="No pudimos cargar la configuración." />
  }
  return (
    <ConfiguracionView
      project={state.project}
      planSurfaceMaxM2={state.planSurfaceMaxM2}
    />
  )
}

function PortalClientesSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | {
        status: "ready"
        data: Awaited<ReturnType<typeof getPortalClientesData>>
        previewContext: Awaited<ReturnType<typeof getPortalClientesPreviewContext>>
      }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      getPortalClientesData(projectId),
      getPortalClientesPreviewContext(projectId),
    ])
      .then(([data, previewContext]) => {
        if (!cancelled) setState({ status: "ready", data, previewContext })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "No pudimos cargar el portal de clientes.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") return <SectionError message={state.message} />
  return (
    <PortalClientesView
      projectId={projectId}
      initialData={state.data}
      previewContext={state.previewContext}
    />
  )
}

function MiUnidadSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | {
        status: "ready"
        data: NonNullable<Awaited<ReturnType<typeof getMiUnidadPageData>>>
        greetingName: string
      }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void Promise.all([getMiUnidadPageData(projectId), getProfileData(projectId)])
      .then(([data, profileData]) => {
        if (cancelled) return
        if (!data) {
          setState({ status: "error" })
          return
        }
        const userProfile = toSidebarUserProfile(profileData)
        const greetingName =
          userProfile.firstName.trim() ||
          userProfile.fullName.split(" ")[0] ||
          "Cliente"
        setState({ status: "ready", data, greetingName })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") {
    return <SectionError message="No pudimos cargar tu unidad." />
  }
    return (
      <MiUnidadView
        projectId={projectId}
        data={state.data}
        greetingName={state.greetingName}
      />
    )
}

function UnitSection({ projectId, unitId }: { projectId: string; unitId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; data: NonNullable<Awaited<ReturnType<typeof getUnitDetailData>>> }
  >({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void getUnitDetailData(projectId, unitId)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setState({ status: "error" })
          return
        }
        setState({ status: "ready", data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [projectId, unitId])

  if (state.status === "loading") return <SectionPending />
  if (state.status === "error") {
    return <SectionError message="No encontramos esta unidad." />
  }
  return <UnitDetailView projectId={projectId} data={state.data} />
}
