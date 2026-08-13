import { notFound, redirect } from "next/navigation"
import type { ReactNode } from "react"
import { ProjectWorkspace } from "@/components/project-shell/ProjectWorkspace"
import { ProjectShell } from "@/components/project-shell/ProjectShell"
import { ProjectAccessProvider } from "@/components/project-shell/ProjectAccessProvider"
import { getProjectSetupStatus } from "@/app/projects/new/actions"
import { assertProjectRoute } from "@/lib/project/assertProjectRoute"
import { getProjectAccessContext } from "@/lib/project/projectAccess"
import { getProjectById } from "@/lib/projects/listUserProjects"
import { getProfileData } from "@/app/[projectId]/perfil/actions"
import { toSidebarUserProfile } from "@/lib/profile/sidebarUserProfile"

type ProjectLayoutProps = {
  children: ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
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
        <ProjectWorkspace project={project} userProfile={userProfile}>
          {children}
        </ProjectWorkspace>
      </ProjectShell>
    </ProjectAccessProvider>
  )
}
