import { getProjectById } from "@/lib/projects/listUserProjects"
import { getProjectClientsData } from "./actions"
import { ClientesView } from "./ClientesView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ClientesPage({ params }: PageProps) {
  const { projectId } = await params
  const project = await getProjectById(projectId)
  if (!project) return null

  const clientsData = await getProjectClientsData(projectId)

  return <ClientesView projectId={projectId} initialData={clientsData} />
}
