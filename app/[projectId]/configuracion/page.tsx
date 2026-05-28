import { Settings } from "lucide-react"
import { ProjectPageHeader } from "@/components/project-shell/ProjectPageHeader"
import { ProjectSectionPlaceholder } from "@/components/project-shell/ProjectSectionPlaceholder"
import { getProjectByIdMock } from "@/lib/projects/mockProjects"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ConfiguracionPage({ params }: PageProps) {
  const { projectId } = await params
  const project = getProjectByIdMock(projectId)
  if (!project) return null

  return (
    <>
      <ProjectPageHeader
        icon={Settings}
        title="Configuración"
        subtitle={`Ajustes generales de ${project.name}`}
      />
      <ProjectSectionPlaceholder
        title="Próximamente"
        description="Esta sección se implementará según el diseño de Figma."
      />
    </>
  )
}
