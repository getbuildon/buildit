import { Building2 } from "lucide-react"
import { ProjectPageHeader } from "@/components/project-shell/ProjectPageHeader"
import { getProjectByIdMock } from "@/lib/projects/mockProjects"

type DashboardPageProps = {
  params: Promise<{ projectId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { projectId } = await params
  const project = getProjectByIdMock(projectId)

  if (!project) {
    return null
  }

  const generalProgress = project.generalProgressPercent ?? project.progressPercent

  return (
    <>
      <ProjectPageHeader
        icon={Building2}
        title={project.name}
        subtitle={`${project.floors} Pisos · ${project.units} Unidades · Progreso General: ${generalProgress}%`}
      />

      <div
        className="rounded-[16px] border p-8 shadow-[0px_1px_2px_rgba(15,23,43,0.06)]"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#e2e8f0",
        }}
      >
        <p className="text-sm leading-5 tracking-[-0.1504px]" style={{ color: "#62748e" }}>
          Contenido del dashboard según Figma (métricas, gráficos y tablas) se implementará en
          la siguiente iteración. El layout lateral y superior ya están listos para reutilizar en
          Certificaciones, Equipo, Clientes y Configuración.
        </p>
      </div>
    </>
  )
}
