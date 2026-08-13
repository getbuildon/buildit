import { redirect } from "next/navigation"
import {
  assertProjectSectionAccess,
  getProjectAccessContext,
} from "@/lib/project/projectAccess"
import { hasStrictProjectPermission } from "@/lib/project/projectPermissions"
import { projectHref } from "@/lib/project/routes"
import { getProjectBasics, getDashboardData } from "./configuracion/actions"
import { DashboardMainView } from "./components/DashboardMainView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ProjectDashboardPage({ params }: PageProps) {
  const { projectId } = await params

  const accessContext = await getProjectAccessContext(projectId)
  if (
    accessContext &&
    accessContext.permissions.clientPortal === true &&
    !hasStrictProjectPermission(accessContext.permissions, "viewDashboard")
  ) {
    redirect(projectHref(projectId, "mi-unidad"))
  }

  await assertProjectSectionAccess(projectId, "")

  const [project, dashboard] = await Promise.all([
    getProjectBasics(projectId),
    getDashboardData(projectId),
  ])
  if (!project) return null

  return <DashboardMainView project={project} dashboard={dashboard} />
}
