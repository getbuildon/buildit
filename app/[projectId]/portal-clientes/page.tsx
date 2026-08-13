import { assertProjectSectionAccess } from "@/lib/project/projectAccess"
import { getPortalClientesData } from "./actions"
import { PortalClientesView } from "./PortalClientesView"

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function PortalClientesPage({ params }: PageProps) {
  const { projectId } = await params
  await assertProjectSectionAccess(projectId, "portal-clientes")
  const data = await getPortalClientesData(projectId)

  return <PortalClientesView projectId={projectId} initialData={data} />
}
