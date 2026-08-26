"use client"

import { useQuery } from "@tanstack/react-query"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectCardSkeleton } from "@/components/projects/ProjectCardSkeleton"
import { BackofficeAccessCallout } from "@/components/home/BackofficeAccessCallout"
import { HomePageLayout } from "@/components/home/HomePageLayout"
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton"
import { CompanyHomeButton } from "@/components/company/CompanyHomeButton"
import { HomePortalClientesButton } from "@/components/home/HomePortalClientesButton"
import { UserMenu } from "@/components/user/UserMenu"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { HOME_COLORS, HOME_LAYOUT } from "@/lib/home/designTokens"
import {
  HOME_QUERY_STALE_MS,
  homeProgressIdsKey,
  homeQueryKeys,
} from "@/lib/home/homeQueryKeys"
import { getHomeShell } from "@/app/home/actions"
import {
  getHomeProjectsProgress,
  listHomeProjects,
} from "@/lib/projects/listUserProjects"

const GRID_SKELETON_COUNT = 3

function HomePage() {
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

  const shell = shellQuery.data
  const displayName = shell?.displayName || user?.email?.split("@")[0] || ""

  if (shellQuery.isPending) {
    return <HomePageSkeleton />
  }

  return (
    <HomePageLayout
      topBar={
        <>
          {shell?.hasClientAccess ? <HomePortalClientesButton /> : null}
          {shell?.primaryCompany ? (
            <CompanyHomeButton
              companyId={shell.primaryCompany.id}
              companyName={shell.primaryCompany.name}
            />
          ) : null}
          <UserMenu
            displayName={displayName}
            firstName={shell?.firstName ?? ""}
            lastName={shell?.lastName ?? ""}
            email={user?.email}
            avatarUrl={shell?.avatarUrl ?? null}
          />
        </>
      }
    >
      <header className={HOME_LAYOUT.header}>
        <h1 className={HOME_LAYOUT.greeting}>¡Bienvenido, {displayName}! 👋</h1>
        {projectsQuery.isPending ? null : projects.length === 0 ? (
          <p className={HOME_LAYOUT.question} style={{ color: HOME_COLORS.subtitle }}>
            {shell?.canCreateProjects
              ? "Creá tu primer proyecto."
              : "No tenés proyectos asignados."}
          </p>
        ) : null}
      </header>

      <div className={HOME_LAYOUT.projectGrid}>
        {projectsQuery.isPending
          ? Array.from({ length: GRID_SKELETON_COUNT }, (_, index) => (
              <ProjectCardSkeleton key={index} />
            ))
          : projects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                progress={progressQuery.data?.[project.projectId]}
              />
            ))}
      </div>
      {progressQuery.isError ? (
        <p className="mt-4 text-center text-sm text-white/80">
          No pudimos cargar el progreso de las obras. Probá de nuevo en un momento.
        </p>
      ) : null}

      {shell ? <BackofficeAccessCallout canAccess={shell.canSeeBackoffice} /> : null}
    </HomePageLayout>
  )
}

export default withAuth(HomePage)
