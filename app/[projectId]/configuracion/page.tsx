import { getProjectById } from "@/lib/projects/listUserProjects"
import { ConfiguracionView } from "./ConfiguracionView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ConfiguracionPage({ params }: PageProps) {
  const { projectId } = await params
  const project = await getProjectById(projectId)
  if (!project) return null

  return <ConfiguracionView projectName={project.name} />
}
