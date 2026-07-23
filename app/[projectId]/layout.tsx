import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { ProjectWorkspace } from "@/components/project-shell/ProjectWorkspace"
import { ProjectAccessProvider } from "@/components/project-shell/ProjectAccessProvider"
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
      <ProjectWorkspace project={project} userProfile={userProfile}>
        {children}
      </ProjectWorkspace>
    </ProjectAccessProvider>
  )
}
