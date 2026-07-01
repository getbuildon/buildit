import { FileCheck2 } from "lucide-react"
import { ProjectPageHeader } from "@/components/project-shell/ProjectPageHeader"
import { ProjectSectionPlaceholder } from "@/components/project-shell/ProjectSectionPlaceholder"
import { getProjectById } from "@/lib/projects/listUserProjects"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function CertificacionesPage({ params }: PageProps) {
  const { projectId } = await params
  const project = await getProjectById(projectId)
  if (!project) return null

  return (
    <div
      style={{
        maxWidth: "747px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      <ProjectPageHeader
        icon={FileCheck2}
        title="Certificaciones"
        subtitle={`Gestión de certificaciones de ${project.name}`}
      />
      <ProjectSectionPlaceholder
        title="Próximamente"
        description="Esta sección se implementará según el diseño de Figma."
      />
    </div>
  )
}
