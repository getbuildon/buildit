import { getProjectBasics } from "../configuracion/actions"
import { getTrabajoDiarioData } from "./actions"
import { DashboardView } from "./DashboardView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { projectId } = await params
  const [project, data] = await Promise.all([
    getProjectBasics(projectId),
    getTrabajoDiarioData(projectId),
  ])
  if (!project) return null

  return (
    <DashboardView
      project={project}
      data={data ?? { floors: [], tasks: [], rubroGroups: [], assignmentsByUnit: {} }}
    />
  )
}
