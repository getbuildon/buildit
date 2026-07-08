import { getProjectById } from "@/lib/projects/listUserProjects"
import { getProjectTeamData } from "./actions"
import { EquipoTeamView } from "./EquipoTeamView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function EquipoPage({ params }: PageProps) {
  const { projectId } = await params
  const project = await getProjectById(projectId)
  if (!project) return null

  const teamData = await getProjectTeamData(projectId)

  return <EquipoTeamView projectId={projectId} initialData={teamData} />
}
