import { notFound, redirect } from "next/navigation"
import type { ReactNode } from "react"
import { MarcoDeObra } from "@/components/obra/MarcoDeObra"
import { ObraEnElNavegador } from "@/components/obra/ObraEnElNavegador"
import { ProjectShell } from "@/components/project-shell/ProjectShell"
import { ProjectAccessProvider } from "@/components/project-shell/ProjectAccessProvider"
import { getProjectSetupStatus } from "@/app/projects/new/actions"
import { assertProjectRoute } from "@/lib/project/assertProjectRoute"
import { getProjectAccessContext } from "@/lib/project/projectAccess"
import { getProjectById } from "@/lib/projects/listUserProjects"
import { getProfileData } from "@/app/project/[projectId]/perfil/actions"
import { toSidebarUserProfile } from "@/lib/profile/sidebarUserProfile"

type ProjectLayoutProps = {
  children: ReactNode
  params: Promise<{ projectId: string }>
}

/** Con servidor de datos (test): el marco de la obra se arma en el navegador, sin consultas acá. */
const conServidorDeDatos = Boolean(process.env.NEXT_PUBLIC_API_URL?.trim())

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  if (conServidorDeDatos) {
    return (
      <ProjectShell>
        <ObraEnElNavegador>{children}</ObraEnElNavegador>
      </ProjectShell>
    )
  }

  // Sin servidor de datos (producción por ahora): el camino de siempre.
  const { projectId } = await params

  const setupStatus = await getProjectSetupStatus(projectId)
  if (setupStatus === "draft") {
    redirect(`/projects/new?projectId=${projectId}`)
  }

  await assertProjectRoute(projectId)

  const [project, profileData, accessContext] = await Promise.all([
    getProjectById(projectId),
    getProfileData(projectId),
    getProjectAccessContext(projectId),
  ])

  if (!project || !accessContext) {
    notFound()
  }

  const userProfile = toSidebarUserProfile(profileData)

  return (
    <ProjectAccessProvider value={accessContext}>
      <ProjectShell>
        <MarcoDeObra project={project} userProfile={userProfile}>
          {children}
        </MarcoDeObra>
      </ProjectShell>
    </ProjectAccessProvider>
  )
}
