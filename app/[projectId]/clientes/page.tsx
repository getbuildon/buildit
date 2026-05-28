import { UserCircle2 } from "lucide-react"
import { ProjectPageHeader } from "@/components/project-shell/ProjectPageHeader"
import { ProjectSectionPlaceholder } from "@/components/project-shell/ProjectSectionPlaceholder"
import { getProjectByIdMock } from "@/lib/projects/mockProjects"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ClientesPage({ params }: PageProps) {
  const { projectId } = await params
  const project = getProjectByIdMock(projectId)
  if (!project) return null

  return (
    <>
      <ProjectPageHeader
        icon={UserCircle2}
        title="Clientes"
        subtitle={`Clientes vinculados a ${project.name}`}
      />
      <ProjectSectionPlaceholder
        title="Próximamente"
        description="Esta sección se implementará según el diseño de Figma."
      />
    </>
  )
}
