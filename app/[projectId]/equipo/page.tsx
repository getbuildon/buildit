import { Users } from "lucide-react"
import { ProjectPageHeader } from "@/components/project-shell/ProjectPageHeader"
import { ProjectSectionPlaceholder } from "@/components/project-shell/ProjectSectionPlaceholder"
import { getProjectByIdMock } from "@/lib/projects/mockProjects"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function EquipoPage({ params }: PageProps) {
  const { projectId } = await params
  const project = getProjectByIdMock(projectId)
  if (!project) return null

  return (
    <>
      <ProjectPageHeader
        icon={Users}
        title="Equipo"
        subtitle={`Miembros y roles del proyecto ${project.name}`}
      />
      <ProjectSectionPlaceholder
        title="Próximamente"
        description="Esta sección se implementará según el diseño de Figma."
      />
    </>
  )
}
