"use client"

import { useEffect } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { getBackofficeDashboardMetrics } from "@/app/backoffice/dashboard/actions"
import { DashboardView } from "@/app/backoffice/dashboard/DashboardView"
import { getBackofficeClientes } from "@/app/backoffice/clientes/actions"
import { ClientesView } from "@/app/backoffice/clientes/ClientesView"
import { getBackofficeUsers } from "@/app/backoffice/usuarios/actions"
import { UsuariosView } from "@/app/backoffice/usuarios/UsuariosView"
import { getBackofficeCompanies } from "@/app/backoffice/empresas/actions"
import { EmpresasView } from "@/app/backoffice/empresas/EmpresasView"
import { getBackofficeProjects } from "@/app/backoffice/proyectos/actions"
import { ProyectosView } from "@/app/backoffice/proyectos/ProyectosView"
import { Spinner } from "@/components/ui/spinner"
import {
  BACKOFFICE_QUERY_GC_MS,
  BACKOFFICE_QUERY_STALE_MS,
  backofficeQueryKeys,
} from "@/lib/backoffice/backofficeQueryKeys"
import { buildDashboardComparison } from "@/lib/backoffice/dashboardComparison"
import { isDashboardPeriodPreset } from "@/lib/backoffice/dashboardPeriod"
import {
  BACKOFFICE_CLIENTES_PAGE_SIZE,
  parseBackofficeClientesPage,
} from "@/lib/backoffice/clientesQuery"
import {
  BACKOFFICE_EMPRESAS_PAGE_SIZE,
  parseBackofficeEmpresasPage,
} from "@/lib/backoffice/empresasQuery"
import {
  BACKOFFICE_PROYECTOS_PAGE_SIZE,
  parseBackofficeProyectosPage,
  parseBackofficeProyectosPlanSlugFilters,
  parseBackofficeProyectosStatusFilters,
} from "@/lib/backoffice/proyectosQuery"
import {
  BACKOFFICE_USERS_PAGE_SIZE,
  parseBackofficeUsersPage,
  parseBackofficeUsersStatusFilters,
} from "@/lib/backoffice/usuariosQuery"
import {
  backofficeHref,
  parseBackofficePath,
  parseBackofficeSection,
  type BackofficeNavSegment,
} from "@/lib/backoffice/navigation"
import { useBackofficeNavigation, useBackofficeSearchParams } from "@/components/backoffice-shell/BackofficeNavigationContext"
import {
  BackofficeClientesSkeleton,
  BackofficeDashboardSkeleton,
  BackofficeEmpresasSkeleton,
  BackofficeProyectosSkeleton,
  BackofficeUsuariosSkeleton,
} from "./skeletons/BackofficePageSkeletons"

type BackofficeAppProps = {
  section?: string[]
}

function SectionPending({ label = "Redirigiendo…" }: { label?: string }) {
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
    <p className="px-6 py-10 text-center text-sm text-[#777b84] lg:px-12">
      {message}
    </p>
  )
}

function searchParam(value: string | null): string | undefined {
  return value ?? undefined
}

export function BackofficeApp({ section }: BackofficeAppProps) {
  const router = useRouter()
  const { pendingHref } = useBackofficeNavigation()
  const paramsRoute = parseBackofficeSection(section)
  const pendingRoute = pendingHref ? parseBackofficePath(pendingHref) : null
  const route =
    pendingRoute && pendingRoute !== "unknown" ? pendingRoute : paramsRoute

  useEffect(() => {
    if (route === "index") {
      router.replace(backofficeHref("dashboard"))
    }
  }, [route, router])

  if (route === "index") {
    return <SectionPending />
  }

  if (route === "unknown") {
    return <SectionError message="No encontramos esta sección." />
  }

  return <BackofficeSection segment={route} />
}

function BackofficeSection({ segment }: { segment: BackofficeNavSegment }) {
  switch (segment) {
    case "dashboard":
      return <DashboardSection />
    case "clientes":
      return <ClientesSection />
    case "usuarios":
      return <UsuariosSection />
    case "empresas":
      return <EmpresasSection />
    case "proyectos":
      return <ProyectosSection />
    default:
      return <SectionError message="No encontramos esta sección." />
  }
}

function DashboardSection() {
  const searchParams = useBackofficeSearchParams()
  const period = searchParam(searchParams.get("period"))
  const from = searchParam(searchParams.get("from"))
  const to = searchParam(searchParams.get("to"))
  const comparePeriodRaw = searchParam(searchParams.get("comparePeriod"))
  const compareFrom = searchParam(searchParams.get("compareFrom"))
  const compareTo = searchParam(searchParams.get("compareTo"))
  const comparePreset = isDashboardPeriodPreset(comparePeriodRaw)
    ? comparePeriodRaw
    : null

  const query = useQuery({
    queryKey: backofficeQueryKeys.dashboard({
      period,
      from,
      to,
      comparePeriod: comparePreset ?? undefined,
      compareFrom,
      compareTo,
    }),
    queryFn: async () => {
      const [metrics, compareMetrics] = await Promise.all([
        getBackofficeDashboardMetrics({ period, from, to }),
        comparePreset
          ? getBackofficeDashboardMetrics({
              period: comparePreset,
              from: compareFrom,
              to: compareTo,
            })
          : Promise.resolve(null),
      ])

      const comparison =
        compareMetrics !== null
          ? buildDashboardComparison(metrics, compareMetrics)
          : null

      return {
        metrics,
        comparison,
        from: metrics.period.preset === "custom" ? from : undefined,
        to: metrics.period.preset === "custom" ? to : undefined,
        comparePreset,
        compareFrom:
          compareMetrics?.period.preset === "custom" ? compareFrom : undefined,
        compareTo:
          compareMetrics?.period.preset === "custom" ? compareTo : undefined,
        comparePeriodLabel: compareMetrics?.period.label,
      }
    },
    staleTime: BACKOFFICE_QUERY_STALE_MS,
    gcTime: BACKOFFICE_QUERY_GC_MS,
    placeholderData: keepPreviousData,
  })

  if (query.isPending && !query.data) return <BackofficeDashboardSkeleton />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar el dashboard." />
  }

  return (
    <DashboardView
      metrics={query.data.metrics}
      from={query.data.from}
      to={query.data.to}
      comparison={query.data.comparison}
      comparePreset={query.data.comparePreset}
      compareFrom={query.data.compareFrom}
      compareTo={query.data.compareTo}
      comparePeriodLabel={query.data.comparePeriodLabel}
      isRefreshing={query.isFetching && !query.isPending}
    />
  )
}

function ClientesSection() {
  const searchParams = useBackofficeSearchParams()
  const page = parseBackofficeClientesPage(searchParam(searchParams.get("page")))
  const search = searchParams.get("q")?.trim() ?? ""

  const query = useQuery({
    queryKey: backofficeQueryKeys.clientes({ page, search }),
    queryFn: () =>
      getBackofficeClientes({
        page,
        pageSize: BACKOFFICE_CLIENTES_PAGE_SIZE,
        search,
      }),
    staleTime: BACKOFFICE_QUERY_STALE_MS,
    gcTime: BACKOFFICE_QUERY_GC_MS,
    placeholderData: keepPreviousData,
  })

  if (query.isPending && !query.data) return <BackofficeClientesSkeleton />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar los clientes." />
  }

  return (
    <ClientesView
      result={query.data}
      initialSearch={search}
      isRefreshing={query.isFetching && !query.isPending}
    />
  )
}

function UsuariosSection() {
  const searchParams = useBackofficeSearchParams()
  const page = parseBackofficeUsersPage(searchParam(searchParams.get("page")))
  const search = searchParams.get("q")?.trim() ?? ""
  const statuses = parseBackofficeUsersStatusFilters(
    searchParam(searchParams.get("status")),
  )

  const query = useQuery({
    queryKey: backofficeQueryKeys.usuarios({ page, search, statuses }),
    queryFn: () =>
      getBackofficeUsers({
        page,
        pageSize: BACKOFFICE_USERS_PAGE_SIZE,
        search,
        statuses,
      }),
    staleTime: BACKOFFICE_QUERY_STALE_MS,
    gcTime: BACKOFFICE_QUERY_GC_MS,
    placeholderData: keepPreviousData,
  })

  if (query.isPending && !query.data) return <BackofficeUsuariosSkeleton />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar los usuarios." />
  }

  return (
    <UsuariosView
      result={query.data}
      initialSearch={search}
      initialStatuses={statuses}
      isRefreshing={query.isFetching && !query.isPending}
    />
  )
}

function EmpresasSection() {
  const searchParams = useBackofficeSearchParams()
  const page = parseBackofficeEmpresasPage(searchParam(searchParams.get("page")))
  const search = searchParams.get("q")?.trim() ?? ""

  const query = useQuery({
    queryKey: backofficeQueryKeys.empresas({ page, search }),
    queryFn: () =>
      getBackofficeCompanies({
        page,
        pageSize: BACKOFFICE_EMPRESAS_PAGE_SIZE,
        search,
      }),
    staleTime: BACKOFFICE_QUERY_STALE_MS,
    gcTime: BACKOFFICE_QUERY_GC_MS,
    placeholderData: keepPreviousData,
  })

  if (query.isPending && !query.data) return <BackofficeEmpresasSkeleton />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar las empresas." />
  }

  return (
    <EmpresasView
      result={query.data}
      initialSearch={search}
      isRefreshing={query.isFetching && !query.isPending}
    />
  )
}

function ProyectosSection() {
  const searchParams = useBackofficeSearchParams()
  const page = parseBackofficeProyectosPage(searchParam(searchParams.get("page")))
  const search = searchParams.get("q")?.trim() ?? ""
  const planSlugs = parseBackofficeProyectosPlanSlugFilters(
    searchParam(searchParams.get("planSlug")),
  )
  const statuses = parseBackofficeProyectosStatusFilters(
    searchParam(searchParams.get("status")),
  )

  const query = useQuery({
    queryKey: backofficeQueryKeys.proyectos({
      page,
      search,
      planSlugs,
      statuses,
    }),
    queryFn: () =>
      getBackofficeProjects({
        page,
        pageSize: BACKOFFICE_PROYECTOS_PAGE_SIZE,
        search,
        planSlugs,
        statuses,
      }),
    staleTime: BACKOFFICE_QUERY_STALE_MS,
    gcTime: BACKOFFICE_QUERY_GC_MS,
    placeholderData: keepPreviousData,
  })

  if (query.isPending && !query.data) return <BackofficeProyectosSkeleton />
  if (query.isError || !query.data) {
    return <SectionError message="No pudimos cargar los proyectos." />
  }

  return (
    <ProyectosView
      result={query.data}
      initialSearch={search}
      initialPlanSlugs={planSlugs}
      initialStatuses={statuses}
      isRefreshing={query.isFetching && !query.isPending}
    />
  )
}
