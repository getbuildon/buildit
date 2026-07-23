import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { ProjectWorkspace } from "@/components/project-shell/ProjectWorkspace"
import { assertProjectRoute } from "@/lib/project/assertProjectRoute"
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

  const project = await getProjectById(projectId)
  if (!project) {
    notFound()
  }

  const profileData = await getProfileData(projectId)
  const userProfile = toSidebarUserProfile(profileData)

  return (
    <ProjectWorkspace project={project} userProfile={userProfile}>
      {children}
    </ProjectWorkspace>
  )
}
