import { getProjectBasics, getDashboardData } from "./configuracion/actions"
import { DashboardMainView } from "./components/DashboardMainView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ProjectDashboardPage({ params }: PageProps) {
  const { projectId } = await params
  const [project, dashboard] = await Promise.all([
    getProjectBasics(projectId),
    getDashboardData(projectId),
  ])
  if (!project) return null

  return <DashboardMainView project={project} dashboard={dashboard} />
}
