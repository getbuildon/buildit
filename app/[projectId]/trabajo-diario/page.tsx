import { getProjectBasics } from "../configuracion/actions"
import { DashboardView } from "./DashboardView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { projectId } = await params
  const project = await getProjectBasics(projectId)
  if (!project) return null

  return <DashboardView project={project} />
}
