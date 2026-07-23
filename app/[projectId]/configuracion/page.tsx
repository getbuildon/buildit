import { assertProjectSectionAccess } from "@/lib/project/projectAccess"
import { getProjectBasics } from "./actions"
import { ConfiguracionView } from "./ConfiguracionView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ConfiguracionPage({ params }: PageProps) {
  const { projectId } = await params
  await assertProjectSectionAccess(projectId, "configuracion")
  const project = await getProjectBasics(projectId)
  if (!project) return null

  return <ConfiguracionView project={project} />
}
