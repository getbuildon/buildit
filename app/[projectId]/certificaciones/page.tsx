import { FileCheck2 } from "lucide-react"
import { ProjectPageHeader } from "@/components/project-shell/ProjectPageHeader"
import { ProjectSectionPlaceholder } from "@/components/project-shell/ProjectSectionPlaceholder"
import { getProjectByIdMock } from "@/lib/projects/mockProjects"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function CertificacionesPage({ params }: PageProps) {
  const { projectId } = await params
  const project = getProjectByIdMock(projectId)
  if (!project) return null

  return (
    <>
      <ProjectPageHeader
        icon={FileCheck2}
        title="Certificaciones"
        subtitle={`Gestión de certificaciones de ${project.name}`}
      />
      <ProjectSectionPlaceholder
        title="Próximamente"
        description="Esta sección se implementará según el diseño de Figma."
      />
    </>
  )
}
